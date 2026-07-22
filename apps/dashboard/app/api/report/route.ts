import { isIP } from "node:net";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getReportPanels } from "@/shared/constants/report-panels";

const REPORT_LIMIT = 3;
const REPORT_WINDOW_MS = 60 * 60 * 1000;
const reportAttempts = new Map<string, number[]>();

const reportSchema = z.object({
  daoId: z.string().trim().min(1).max(100),
  section: z.string().trim().min(1).max(100),
  panel: z.string().trim().min(1).max(200),
  description: z.string().trim().min(3).max(5000),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  url: z.string().url().max(2000),
});

const getClientIP = (request: NextRequest) => {
  const realIP = request.headers.get("x-real-ip")?.trim();
  return realIP && isIP(realIP) ? realIP : null;
};

const isRateLimited = (ip: string, now = Date.now()) => {
  const attempts = (reportAttempts.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < REPORT_WINDOW_MS,
  );

  if (attempts.length >= REPORT_LIMIT) {
    reportAttempts.set(ip, attempts);
    return true;
  }

  reportAttempts.set(ip, [...attempts, now]);
  return false;
};

const formatDescription = ({
  description,
  url,
  email,
}: {
  description: string;
  url: string;
  email?: string;
}) =>
  [
    "## User report",
    "",
    description,
    "",
    `Page URL: ${url}`,
    ...(email ? [`Reporter email: ${email}`] : []),
  ].join("\n");

export const POST = async (request: NextRequest) => {
  try {
    const payload = reportSchema.parse(await request.json());
    if (!getReportPanels(payload.section).includes(payload.panel as never)) {
      return NextResponse.json(
        { error: "Invalid panel selected" },
        { status: 400 },
      );
    }

    // Railway supplies x-real-ip. A shared fallback bucket still protects the
    // public endpoint if a deployment is temporarily missing that header.
    const clientIP = getClientIP(request) ?? "unknown";
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          error:
            "Too many reports from this address. Please try again in an hour.",
        },
        { status: 429 },
      );
    }

    const token = process.env.CLICKUP_API_TOKEN;
    const listId = process.env.CLICKUP_REPORT_LIST_ID;
    if (!token || !listId) {
      console.error("ClickUp report integration is not configured");
      return NextResponse.json(
        {
          error: "Reports are temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      );
    }

    const clickUpResponse = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        method: "POST",
        headers: { Authorization: token, "content-type": "application/json" },
        body: JSON.stringify({
          name: `[Report] ${payload.daoId.toUpperCase()} — ${payload.panel}`,
          markdown_description: formatDescription(payload),
        }),
      },
    );

    if (!clickUpResponse.ok) {
      console.error("ClickUp report creation failed", clickUpResponse.status);
      return NextResponse.json(
        { error: "We couldn't submit your report. Please try again shortly." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: "Report submitted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Report submission failed", error);
    return NextResponse.json(
      { error: "We couldn't submit your report. Please try again shortly." },
      { status: 502 },
    );
  }
};
