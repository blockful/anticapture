import type { Page } from "playwright/test";

import { test, expect } from "./fixtures";

const waitForProposalLink = async (page: Page) => {
  const proposalLink = page
    .getByRole("link")
    .filter({ has: page.locator("h3") })
    .first();
  const proposalsErrored = page
    .getByText("Unable to load proposals")
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "error" as const);
  const proposalLoaded = proposalLink
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "proposal" as const);

  const outcome = await Promise.race([proposalLoaded, proposalsErrored]);
  expect(outcome, "proposal list rendered an error state").toBe("proposal");
  return proposalLink;
};

const waitForSourceSelect = async (page: Page) => {
  const sourceSelect = page.getByRole("combobox", {
    name: "Proposal source",
  });
  const proposalsErrored = page
    .getByText("Unable to load proposals")
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => "error" as const);
  const sourceLoaded = sourceSelect
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => "source" as const);

  const outcome = await Promise.race([sourceLoaded, proposalsErrored]);
  expect(outcome, "proposal source filter rendered an error state").toBe(
    "source",
  );
  return sourceSelect;
};

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
    const allTab = page.getByRole("tab", { name: /All/ });
    await expect(allTab).toBeVisible({ timeout: 15_000 });
    await expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  test("shows proposal list with real data on All Proposals tab", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    await expect(page.getByRole("tab", { name: /All/ })).toBeVisible({
      timeout: 15_000,
    });
    const proposalLink = await waitForProposalLink(page);
    await expect(proposalLink.locator("h3")).not.toHaveText("");
  });

  test("source filter switches to Snapshot (offchain) proposals", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    const sourceSelect = await waitForSourceSelect(page);

    await sourceSelect.click();
    await page.getByRole("option", { name: "Snapshot" }).click();
    await expect(page).toHaveURL(/source=snapshot/);
    const proposalLink = await waitForProposalLink(page);
    await expect(proposalLink).toContainText("Snapshot");
    await expect(proposalLink.locator("h3")).not.toHaveText("");
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
    await expect(page.getByRole("tab", { name: /All/ })).toBeVisible({
      timeout: 15_000,
    });
    const proposalLinks = page
      .getByRole("link")
      .filter({ has: page.locator("h3") });
    await waitForProposalLink(page);
    const href = await proposalLinks.first().getAttribute("href");
    await proposalLinks.first().locator("h3").click();
    await expect(page).toHaveURL(/\/ens\/proposals\//, { timeout: 15_000 });
    if (href) {
      await expect(page).toHaveURL(
        new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    }
  });

  test("infinite scroll loads more proposals when available", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    await expect(page.getByRole("tab", { name: /All/ })).toBeVisible({
      timeout: 15_000,
    });
    const proposalLinks = page
      .getByRole("link")
      .filter({ has: page.locator("h3") });
    await waitForProposalLink(page);
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
