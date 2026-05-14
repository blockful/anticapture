import { test as base, expect } from "playwright/test";
import { acceptCookieConsent } from "./helpers/cookie-consent";
import { watch5xxErrors } from "./helpers/network";
import { waitForPageReady } from "./helpers/page-ready";

type DashboardFixtures = {
  /** Navigate to a URL with cookie consent pre-accepted and 5xx watching. */
  goto: (url: string) => Promise<void>;
};

export const test = base.extend<DashboardFixtures>({
  goto: async ({ page }, use) => {
    await acceptCookieConsent(page);
    watch5xxErrors(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (url: string) => {
      await page.goto(url);
      await waitForPageReady(page);
    });
  },
});

export { expect };
