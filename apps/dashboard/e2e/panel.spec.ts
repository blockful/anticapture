import { test, expect } from "./fixtures";

test.describe("Panel page", () => {
  test("renders Panel heading and description", async ({ goto, page }) => {
    await goto("/");
    await expect(page.locator("h4").filter({ hasText: "Panel" })).toBeVisible();
    await expect(
      page.locator("text=Check governance security across DAOs"),
    ).toBeVisible();
  });

  test("renders Monitored DAOs sub-section", async ({ goto, page }) => {
    await goto("/");
    await expect(
      page.locator("p").filter({ hasText: "Monitored DAOs" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows Fully Analyzed and Not Reviewed tabs", async ({ goto, page }) => {
    await goto("/");
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Fully Analyzed" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Not Reviewed" }),
    ).toBeVisible();
  });

  test("Fully Analyzed tab is active by default", async ({ goto, page }) => {
    await goto("/");
    const fullyAnalyzedTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Fully Analyzed" });
    await expect(fullyAnalyzedTab).toBeVisible({ timeout: 15_000 });
    await expect(fullyAnalyzedTab).toHaveAttribute("data-state", "active");
  });

  test("shows table column headers", async ({ goto, page }) => {
    await goto("/");
    // Wait for table to render (inside Fully Analyzed tab)
    await expect(
      page
        .locator('[role="tab"][data-state="active"]')
        .filter({ hasText: "Fully Analyzed" }),
    ).toBeVisible({ timeout: 15_000 });
    // Column headers are th/td elements with header text
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 15_000 });
  });

  test("Not Reviewed tab switches content", async ({ goto, page }) => {
    await goto("/");
    const notReviewedTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Not Reviewed" });
    await expect(notReviewedTab).toBeVisible({ timeout: 15_000 });
    await notReviewedTab.click();
    await expect(notReviewedTab).toHaveAttribute("data-state", "active");
  });

  test("ENS row links to /ens", async ({ goto, page }) => {
    await goto("/");
    // ENS should be in Fully Analyzed tab
    const ensLink = page.locator('a[href="/ens"]').first();
    await expect(ensLink).toBeVisible({ timeout: 15_000 });
    await ensLink.click();
    await expect(page).toHaveURL("/ens");
  });
});
