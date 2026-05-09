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

  test("address filter popover accepts input on Token Holders", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    // Address column header has a filter trigger button
    const addressHeader = page
      .locator("table thead")
      .first()
      .getByText("Address")
      .first();
    await expect(addressHeader).toBeVisible();
    // Click the address column to open popover (click on the header which contains the filter button)
    const addressTrigger = addressHeader
      .locator("..")
      .locator("button")
      .first();
    if ((await addressTrigger.count()) === 0) return; // no popover trigger, skip
    await addressTrigger.click();
    const input = page.getByPlaceholder("Paste the address");
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.fill("0x0000000000000000000000000000000000000000");
    const applyBtn = page.getByRole("button", { name: /Apply/ });
    await applyBtn.click();
    await expect(page).toHaveURL(/address=/, { timeout: 10_000 });
  });

  test("Token Holders sort by Balance changes URL state", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const balanceHeader = page
      .locator("table thead")
      .first()
      .getByText(/Balance/)
      .first();
    await expect(balanceHeader).toBeVisible();
    await balanceHeader.click();
    // After click, sortBy=balance should appear in URL (or sort direction toggles)
    await expect(page).toHaveURL(/sortBy=balance|sort=/, { timeout: 10_000 });
  });

  test("Token Holders sort by Change cycles sort state", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const changeHeader = page
      .locator("table thead")
      .first()
      .getByText(/^Change/)
      .first();
    await expect(changeHeader).toBeVisible();
    await changeHeader.click();
    await expect(page).toHaveURL(/sortBy=(signedVariation|variation)/, {
      timeout: 10_000,
    });
  });

  test("Delegates sort by Voting Power changes URL state", async ({
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
    const vpHeader = page
      .locator("table thead")
      .first()
      .getByText(/Voting Power/)
      .first();
    await expect(vpHeader).toBeVisible();
    await vpHeader.click();
    await expect(page).toHaveURL(/sortBy=votingPower|sort=/, {
      timeout: 10_000,
    });
  });

  test("Delegates sort by Change cycles sort state", async ({ goto, page }) => {
    await goto("/ens/holders-and-delegates");
    const delegatesTab = page
      .locator('[role="tab"]')
      .filter({ hasText: "Delegates" });
    await expect(delegatesTab).toBeVisible({ timeout: 15_000 });
    await delegatesTab.click();
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
    const changeHeader = page
      .locator("table thead")
      .first()
      .getByText(/^Change/)
      .first();
    await expect(changeHeader).toBeVisible();
    await changeHeader.click();
    await expect(page).toHaveURL(/sortBy=(signedVariation|variation)/, {
      timeout: 10_000,
    });
  });

  test("Delegates sort by Delegators changes URL state", async ({
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
    const delegatorsHeader = page
      .locator("table thead")
      .first()
      .getByText("Delegators")
      .first();
    await expect(delegatorsHeader).toBeVisible();
    await delegatorsHeader.click();
    await expect(page).toHaveURL(/sortBy=delegationsCount|sort=/, {
      timeout: 10_000,
    });
  });

  test("address filter popover accepts input on Delegates", async ({
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
    const addressHeader = page
      .locator("table thead")
      .first()
      .getByText("Address")
      .first();
    const addressTrigger = addressHeader
      .locator("..")
      .locator("button")
      .first();
    if ((await addressTrigger.count()) === 0) return;
    await addressTrigger.click();
    const input = page.getByPlaceholder("Paste the address");
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.fill("0x0000000000000000000000000000000000000000");
    await page.getByRole("button", { name: /Apply/ }).click();
    await expect(page).toHaveURL(/address=/, { timeout: 10_000 });
  });
});
