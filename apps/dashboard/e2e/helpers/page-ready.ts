import type { Page } from "playwright/test";

/** Wait for page to hydrate and have no loading spinners. */
export async function waitForPageReady(
  page: Page,
  options: { timeout?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 15_000;
  // Wait for DOM content loaded + no active network activity
  await page.waitForLoadState("domcontentloaded", { timeout });
  // Wait for no loading skeleton/spinner to be visible
  // (Next.js Suspense boundaries and TanStack Query loading states)
  await page.waitForFunction(() => document.readyState === "complete", {
    timeout,
  });
}
