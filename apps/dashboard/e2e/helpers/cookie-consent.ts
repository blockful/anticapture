import type { Page } from "playwright/test";

/** Inject accepted cookie consent into localStorage before page navigation. */
export async function acceptCookieConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ status: "accepted", timestamp: Date.now() }),
    );
  });
}
