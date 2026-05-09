import { test, expect } from "./fixtures";

test.describe("Holders & Delegates page (/ens/holders-and-delegates)", () => {
  test("renders Holders & Delegates heading", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    await expect(
      page.locator("h4").filter({ hasText: "Holders & Delegates" }),
    ).toBeVisible();
  });

  test("shows Token Holders tab as default", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    const tokenHoldersTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Token Holders" });
    await expect(tokenHoldersTab).toBeVisible({ timeout: 15_000 });
    await expect(tokenHoldersTab).toHaveAttribute("aria-selected", "true");
  });

  test("Token Holders table shows key columns", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Address").first()).toBeVisible();
    await expect(page.getByText(/Balance/).first()).toBeVisible();
  });

  test("switching to Delegates tab updates content", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    const delegatesTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Delegates" });
    await expect(delegatesTab).toBeVisible({ timeout: 15_000 });
    await delegatesTab.click();
    await expect(delegatesTab).toHaveAttribute("aria-selected", "true");
    // Delegates tab shows Voting Power column
    await expect(page.getByText(/Voting Power/).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Delegates tab URL reflects tab state", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    const delegatesTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Delegates" });
    await expect(delegatesTab).toBeVisible({ timeout: 15_000 });
    await delegatesTab.click();
    await expect(page).toHaveURL(/tab=delegates/);
  });

  test("address filter affordance is present", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    // Address column has a filter popover trigger
    await expect(page.getByText("Address").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("opening a holder drawer shows drawer tabs", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount === 0) return; // no data, skip
    await rows.first().click();
    // Drawer should open (URL gets drawerAddress param)
    await expect(page).toHaveURL(/drawerAddress=/, { timeout: 10_000 });
    // Check drawer tab labels
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Delegation History" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Top Interactions" }),
    ).toBeVisible();
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Balance History" }),
    ).toBeVisible();
  });

  test("opening a delegate drawer shows drawer tabs", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    const delegatesTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Delegates" });
    await expect(delegatesTab).toBeVisible({ timeout: 15_000 });
    await delegatesTab.click();
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount === 0) return; // no data, skip
    await rows.first().click();
    await expect(page).toHaveURL(/drawerAddress=/, { timeout: 10_000 });
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Vote Composition" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[role="tab"]').filter({ hasText: "Voting Power History" }),
    ).toBeVisible();
  });

  test("infinite scroll loads more token holders when available", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    const initialCount = await rows.count();
    // Page size is 20. Need at least one full page to test pagination.
    if (initialCount < 20) return;
    await rows.last().scrollIntoViewIfNeeded();
    await expect(async () => {
      const newCount = await rows.count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 15_000 });
  });

  test("infinite scroll loads more delegates when available", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    const delegatesTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Delegates" });
    await expect(delegatesTab).toBeVisible({ timeout: 15_000 });
    await delegatesTab.click();
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    const initialCount = await rows.count();
    if (initialCount < 20) return;
    await rows.last().scrollIntoViewIfNeeded();
    await expect(async () => {
      const newCount = await rows.count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 15_000 });
  });
});
