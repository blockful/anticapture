import { test, expect } from "./fixtures";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("Mobile smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("Panel (/) renders heading on mobile", async ({ goto, page }) => {
    await goto("/");
    await expect(page.locator("h4").filter({ hasText: "Panel" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("DAO Overview (/ens) renders on mobile", async ({ goto, page }) => {
    await goto("/ens");
    await expect(page.locator("h3").filter({ hasText: "ENS" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Holders & Delegates (/ens/holders-and-delegates) renders heading on mobile", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    await expect(
      page.locator("h4").filter({ hasText: "Holders & Delegates" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Proposals (/ens/proposals) renders heading on mobile", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    await expect(
      page.locator("h4").filter({ hasText: "Proposals" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Activity Feed (/ens/activity-feed) renders heading on mobile", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    await expect(
      page.locator("h4").filter({ hasText: "Activity Feed" }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
