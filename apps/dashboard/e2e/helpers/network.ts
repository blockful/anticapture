import type { Page } from "playwright/test";

/**
 * `/api/gateful/*` is a transparent proxy that forwards the upstream DAO API
 * status verbatim. A 5xx there reflects external data-source health (e.g. a
 * degraded/unindexed DAO), which the dashboard absorbs gracefully by design —
 * not an app defect. Skip those so flaky upstream data can't fail unrelated
 * UX assertions, while staying strict on the dashboard's own routes.
 */
const isUpstreamProxyPath = (url: string): boolean => {
  try {
    return new URL(url).pathname.startsWith("/api/gateful/");
  } catch {
    return false;
  }
};

/**
 * Attach a listener that throws on any same-origin 5xx response.
 * Call before navigation; the test will fail if an app API 5xx fires.
 */
export function watch5xxErrors(page: Page): void {
  page.on("response", (response) => {
    const url = response.url();
    const isSameOrigin =
      url.startsWith("http://localhost") ||
      url.startsWith(
        process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
      );
    if (isSameOrigin && !isUpstreamProxyPath(url) && response.status() >= 500) {
      throw new Error(`5xx response: ${response.status()} ${url}`);
    }
  });
}
