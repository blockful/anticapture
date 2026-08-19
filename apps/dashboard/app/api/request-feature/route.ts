import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const requestFeatureFormSchema = z.object({
  email: z.string().email(),
  featureRequest: z.string().min(10),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  otherThoughts: z.string().optional(),
  daoId: z.string().min(1),
});

const PRIORITY_LABELS: Record<string, string> = {
  low: "Not blocking, just an idea",
  normal: "Would improve my experience",
  high: "Blocking part of my work",
  urgent: "Completely blocking me",
};

// Simple in-memory rate limiting (per instance; can be enhanced with Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 emails per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toHtmlParagraph(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    const validatedData = requestFeatureFormSchema.parse(body);

    const priorityText =
      PRIORITY_LABELS[validatedData.priority] ?? validatedData.priority;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.CONTACT_EMAIL || "contact@blockful.io",
      replyTo: validatedData.email,
      subject: `Feature Request (${validatedData.daoId.toUpperCase()}) - ${validatedData.priority.toUpperCase()}`,
      html: `
        <h2>New Feature Request</h2>
        <p><strong>DAO:</strong> ${escapeHtml(validatedData.daoId.toUpperCase())}</p>
        <p><strong>From:</strong> ${escapeHtml(validatedData.email)}</p>
        <p><strong>Priority:</strong> ${priorityText}</p>
        <p><strong>What would you like to see built?</strong></p>
        <p>${toHtmlParagraph(validatedData.featureRequest)}</p>
        ${
          validatedData.otherThoughts
            ? `<p><strong>Any other thoughts?</strong></p>
        <p>${toHtmlParagraph(validatedData.otherThoughts)}</p>`
            : ""
        }
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Email sent successfully", id: data?.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
