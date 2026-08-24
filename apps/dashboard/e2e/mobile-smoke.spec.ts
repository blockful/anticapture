import { test, expect } from "./fixtures";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("Mobile smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("Panel (/) renders heading on mobile", async ({ goto, page }) => {
    await goto("/");
    // Panel v2.1 dropped the "Panel" section title; the hero h1 is the page
    // heading on every viewport.
    await expect(
      page
        .locator("h1")
        .filter({ hasText: "See which DAOs could be captured" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("DAO Overview (/ens) renders on mobile", async ({ goto, page }) => {
    await goto("/ens");
    // exact: true — proposal cards on the page can also render h3s containing
    // "ENS", so a substring match hits a strict mode violation with live data.
    await expect(
      page.getByRole("heading", { name: "ENS", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Stakeholders (/ens/stakeholders) renders heading on mobile", async ({
    goto,
    page,
  }) => {
    await goto("/ens/stakeholders");
    await expect(
      page.locator("h4").filter({ hasText: "Stakeholders" }),
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
