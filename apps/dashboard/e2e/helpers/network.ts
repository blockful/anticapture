import type { Page } from "playwright/test";

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
    if (isSameOrigin && response.status() >= 500) {
      throw new Error(`5xx response: ${response.status()} ${url}`);
    }
  });
}
