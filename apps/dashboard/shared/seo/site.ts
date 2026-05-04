const FALLBACK_SITE_URL = "https://app.anticapture.com";

export const SITE_NAME = "Anticapture";
export const SITE_DESCRIPTION =
  "Anticapture is a DAO governance security platform that quantifies hostile takeover risk, detects governance capture, and tracks resilience metrics across major DAOs.";
export const SITE_TAGLINE = "DAO Governance Security Dashboard";
export const ORGANIZATION_NAME = "Anticapture";
export const ORGANIZATION_ALT_NAME = "Blockful Anticapture";

export function getSiteUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!configuredUrl) {
    return FALLBACK_SITE_URL;
  }

  return configuredUrl.replace(/\/+$/, "");
}

export function toAbsoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
