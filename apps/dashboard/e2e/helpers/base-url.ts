// A dedicated port keeps reuseExistingServer from latching onto an unrelated
// dev server that happens to occupy the default 3000.
export const E2E_PORT = process.env.PLAYWRIGHT_PORT ?? "3100";

// Checkly's runners set CHECKLY=1; there the suite monitors production.
export const REMOTE_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (process.env.CHECKLY === "1" ? "https://app.anticapture.com" : undefined);

export const BASE_URL = REMOTE_BASE_URL ?? `http://localhost:${E2E_PORT}`;
