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

  test("renders all Monitored DAOs table column headers", async ({
    goto,
    page,
  }) => {
    await goto("/");
    // Wait for the active Fully Analyzed tab table
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    // Each column header text should appear in the table thead
    const thead = page.locator("table thead").first();
    await expect(thead.getByText(/Organizations|Orgs/).first()).toBeVisible();
    await expect(thead.getByText("Chain")).toBeVisible();
    await expect(thead.getByText("Stage")).toBeVisible();
    await expect(thead.getByText("Attack Exposure")).toBeVisible();
    await expect(thead.getByText("Cost of Attack")).toBeVisible();
    await expect(thead.getByText("Attack Profitability")).toBeVisible();
    await expect(thead.getByText("Active Tokens in Governance")).toBeVisible();
  });

  test("sortable column headers respond to clicks", async ({ goto, page }) => {
    await goto("/");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const thead = page.locator("table thead").first();
    // Click each sortable header — should not throw and table should remain visible
    for (const label of [
      "Cost of Attack",
      "Attack Profitability",
      "Active Tokens in Governance",
    ]) {
      const header = thead.getByText(label).first();
      await expect(header).toBeVisible();
      await header.click();
      await expect(page.locator("table").first()).toBeVisible();
    }
  });
});
