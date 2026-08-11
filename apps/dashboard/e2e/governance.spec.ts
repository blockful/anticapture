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
  test(
    "renders Proposals heading and description",
    { tag: "@smoke" },
    async ({ goto, page }) => {
      await goto("/ens/proposals");
      await expect(
        page.locator("h4").filter({ hasText: "Proposals" }),
      ).toBeVisible();
      await expect(
        page.locator("text=View and vote on executable proposals"),
      ).toBeVisible();
    },
  );

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

  test("shows Snapshot quorum identifier on proposal progress bar", async ({
    goto,
    page,
  }) => {
    await page.route(
      /\/api\/gateful\/ens\/offchain\/proposals(\?.*)?$/,
      async (route) => {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "snapshot-quorum-marker",
                spaceId: "ens.eth",
                author: "0x0000000000000000000000000000000000000001",
                title: "Snapshot quorum marker proposal",
                body: "",
                discussion: "",
                type: "basic",
                start: 1767225600,
                end: 1798761600,
                state: "active",
                created: 1767225600,
                updated: 1767225600,
                link: "https://snapshot.box/#/s:ens.eth/proposal/snapshot-quorum-marker",
                flagged: false,
                scores: [60, 20, 10],
                scoresTotal: 90,
                quorum: 45,
                choices: ["For", "Against", "Abstain"],
                network: "1",
                snapshot: null,
                strategies: [],
              },
            ],
            totalCount: 1,
          }),
        });
      },
    );

    await goto("/ens/proposals?source=snapshot");

    const proposalLink = await waitForProposalLink(page);
    await expect(proposalLink).toContainText("Snapshot quorum marker proposal");
    await expect(
      proposalLink.getByLabel("Snapshot quorum marker"),
    ).toBeVisible();
    await expect(proposalLink).toContainText("Quorum: 45");
    await proposalLink.getByText("Quorum: 45").hover();
    await expect(page.getByText("For: 60 (67%)").last()).toBeVisible();
  });

  test("New Proposal asks for sign-in when disconnected", async ({
    goto,
    page,
  }) => {
    await goto("/ens/proposals");
    const newProposalBtn = page.getByRole("button", { name: /New Proposal/ });
    const count = await newProposalBtn.count();
    if (count === 0) return; // DAO doesn't support proposals, skip
    await expect(newProposalBtn).toBeVisible({ timeout: 15_000 });
    await newProposalBtn.click();
    await page.getByRole("menuitem", { name: "Create new" }).click();
    // The dialog renders the title twice (an sr-only copy plus the visible
    // one), so assert the unique CTA instead.
    await expect(
      page.getByRole("button", { name: "Connect wallet" }),
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

  test("shows a stable not-found state for a missing proposal", async ({
    goto,
    page,
  }) => {
    await page.route(
      "**/api/gateful/ens/proposals/not-found-proposal",
      (route) =>
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Proposal not found" }),
        }),
    );

    await goto("/ens/proposals/not-found-proposal");

    // The query client retries the 404 three times (~7s of backoff) before the
    // not-found state renders, on top of the dev server compiling the route on
    // first hit, so this needs far more than the 5s expect default.
    await expect(page.getByText("Proposal not found")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("The proposal wasn't found.")).toBeVisible();
    await expect(page.getByTestId("route-error-fallback")).not.toBeVisible();
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
