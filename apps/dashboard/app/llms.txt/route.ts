import { NextResponse } from "next/server";

import daoConfigByDaoId from "@/shared/dao-config";
import { getSiteUrl } from "@/shared/seo/site";

export function GET() {
  const baseUrl = getSiteUrl();
  const daoUrls = Object.keys(daoConfigByDaoId)
    .map((daoId) => `${baseUrl}/${daoId.toLowerCase()}`)
    .join("\n");

  const body = [
    "# Anticapture",
    "",
    "> Anticapture is a DAO governance security dashboard and research framework.",
    "",
    `Primary site: ${baseUrl}`,
    `FAQ: ${baseUrl}/faq`,
    `Glossary: ${baseUrl}/glossary`,
    `Contact: ${baseUrl}/contact`,
    `Terms: ${baseUrl}/terms-of-service`,
    "",
    "Key DAO pages:",
    daoUrls,
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
