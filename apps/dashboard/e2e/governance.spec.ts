import { test, expect } from "./fixtures";

test.describe("Governance page (/ens/proposals)", () => {
  test("renders Proposals heading and description", async ({ goto, page }) => {
    await goto("/ens/proposals");
    await expect(
      page.locator("h4").filter({ hasText: "Proposals" }),
    ).toBeVisible();
    await expect(
      page.locator("text=View and vote on executable proposals"),
    ).toBeVisible();
  });

  test("shows All Proposals tab as default", async ({ goto, page }) => {
    await goto("/ens/proposals");
    const allTab = page.getByRole("tab", { name: /All Proposals/ });
    await expect(allTab).toBeVisible({ timeout: 15_000 });
    await expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  test("shows proposal list or explicit empty state on the proposals tab", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    await expect(page.getByRole("tab", { name: /All Proposals/ })).toBeVisible({
      timeout: 15_000,
    });
    const hasProposals = page
      .getByRole("link")
      .filter({ has: page.locator("h3") })
      .first();
    const isEmpty = page.locator("text=No proposals found");
    const failedToLoad = page.locator("text=Unable to load proposals");
    await expect(hasProposals.or(isEmpty).or(failedToLoad)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("source filter switches to Snapshot and updates the URL", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    // ENS has off-chain proposals, so the proposals tab exposes a source
    // filter (All sources / Snapshot / Governor) next to it.
    const sourceFilter = page.getByRole("combobox", { name: /All sources/ });
    await expect(sourceFilter).toBeVisible({ timeout: 15_000 });
    await sourceFilter.click();
    await page.getByRole("option", { name: "Snapshot" }).click();
    await expect(page).toHaveURL(/source=snapshot/);
    // Off-chain (Snapshot) list loads or shows an explicit empty / error state.
    const hasProposals = page
      .getByRole("link")
      .filter({ has: page.locator("h3") })
      .first();
    const isEmpty = page.locator("text=No proposals found");
    const failedToLoad = page.locator("text=Unable to load proposals");
    await expect(hasProposals.or(isEmpty).or(failedToLoad)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("New Proposal button triggers wallet connect when disconnected", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    const newProposalBtn = page.getByRole("button", { name: /New Proposal/ });
    const count = await newProposalBtn.count();
    if (count === 0) return; // DAO doesn't support proposals, skip
    await expect(newProposalBtn).toBeVisible({ timeout: 15_000 });
    await newProposalBtn.click();
    // Wallet connect modal should open (RainbowKit)
    await expect(
      page
        .locator("text=Connect Wallet")
        .or(page.locator("text=Connect a Wallet")),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navigates to first proposal detail when proposals exist", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    await expect(page.getByRole("tab", { name: /All Proposals/ })).toBeVisible({
      timeout: 15_000,
    });
    const proposalLinks = page
      .getByRole("link")
      .filter({ has: page.locator("h3") });
    const count = await proposalLinks.count();
    if (count === 0) return; // no proposals live, skip
    const href = await proposalLinks.first().getAttribute("href");
    await proposalLinks.first().click();
    await expect(page).toHaveURL(/\/ens\/proposals\//, { timeout: 15_000 });
    if (href) {
      await expect(page).toHaveURL(
        new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    }
  });

  test("infinite scroll loads more onchain proposals when available", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    await expect(page.getByRole("tab", { name: /All Proposals/ })).toBeVisible({
      timeout: 15_000,
    });
    const proposalLinks = page
      .getByRole("link")
      .filter({ has: page.locator("h3") });
    const isEmpty = page.locator("text=No proposals found");
    const failedToLoad = page.locator("text=Unable to load proposals");
    // Wait for one of: proposals load, empty state, or error state.
    await expect(
      proposalLinks.first().or(isEmpty).or(failedToLoad),
    ).toBeVisible({ timeout: 20_000 });
    // If no proposals rendered (empty or error), there's nothing to scroll.
    if ((await proposalLinks.count()) === 0) return;
    const initialCount = await proposalLinks.count();
    // Page size is 10. Need at least one full page to test pagination.
    if (initialCount < 10) return;
    await proposalLinks.last().scrollIntoViewIfNeeded();
    await expect(async () => {
      const newCount = await proposalLinks.count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 15_000 });
  });
});
