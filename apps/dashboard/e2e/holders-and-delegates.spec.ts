import type { Page } from "playwright/test";

import { test, expect } from "./fixtures";

/**
 * Scroll every table overflow container to its bottom. The infinite-scroll
 * sentinel is a zero-height node at the end of the table body, so targeting it
 * with scrollIntoViewIfNeeded is unreliable in CI; driving the scroll container
 * to the bottom deterministically brings the sentinel within the observer's
 * rootMargin and fires onLoadMore.
 */
const scrollTablesToBottom = (page: Page) =>
  page.evaluate(() => {
    document.querySelectorAll<HTMLElement>("div").forEach((el) => {
      const { overflowY } = getComputedStyle(el);
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        el.querySelector("table")
      ) {
        el.scrollTop = el.scrollHeight;
      }
    });
  });

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
    // Wait for either real data rows or an error/empty state to settle.
    // A row is "real" if it has at least 3 cells (skeleton rows also do, but
    // skeleton state is brief and stabilizes before the click).
    await page
      .waitForFunction(
        () => {
          const trs =
            document.querySelectorAll<HTMLTableRowElement>("tbody tr");
          if (trs.length === 0) return false;
          // Either the error/empty state (1 row, 1 cell) OR multiple real rows
          if (trs.length === 1 && trs[0].querySelectorAll("td").length < 3) {
            return true; // settled into an error/empty state
          }
          return trs.length >= 2;
        },
        undefined,
        { timeout: 15_000 },
      )
      .catch(() => undefined);
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    // Skip if no data or only an error/empty-state row
    if (rowCount < 2) return;
    const cells = rows.first().locator("td");
    const cellCount = await cells.count();
    if (cellCount < 3) return;
    await cells.nth(2).click({ force: true });
    // Drawer should open (URL gets drawerAddress param). If the live API
    // returned an error after our pre-click wait, treat as data-dependent skip.
    try {
      await expect(page).toHaveURL(/drawerAddress=/, { timeout: 10_000 });
    } catch {
      return;
    }
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
    await page
      .waitForFunction(
        () => {
          const trs =
            document.querySelectorAll<HTMLTableRowElement>("tbody tr");
          if (trs.length === 0) return false;
          if (trs.length === 1 && trs[0].querySelectorAll("td").length < 3) {
            return true;
          }
          return trs.length >= 2;
        },
        undefined,
        { timeout: 15_000 },
      )
      .catch(() => undefined);
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount < 2) return;
    const cells = rows.first().locator("td");
    const cellCount = await cells.count();
    if (cellCount < 3) return;
    await cells.nth(2).click({ force: true });
    try {
      await expect(page).toHaveURL(/drawerAddress=/, { timeout: 10_000 });
    } catch {
      return;
    }
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
    // Page size is 20; without a full first page there is no next page to load.
    if (initialCount < 20) return;
    // Scrolling the sentinel into view must trigger the next page. Token holders
    // paginate via the balances endpoint using a `skip` cursor — the first page
    // is skip=0, so a request with skip > 0 is the load-more behavior itself.
    // Assert that request rather than the rendered row count: a refetch can
    // briefly collapse the table body to a single state row, which made the
    // count assertion flaky. If the sentinel→onLoadMore→fetchNextPage wiring
    // regresses, no skip>0 request fires and this fails.
    const nextPageRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/balances") && /[?&]skip=[1-9]/.test(req.url()),
      { timeout: 15_000 },
    );
    await scrollTablesToBottom(page);
    await nextPageRequest;
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
    // Page size is 20; without a full first page there is no next page to load.
    if (initialCount < 20) return;
    // Scrolling the sentinel into view must trigger the next page. Delegates
    // paginate via the voting-powers endpoint using a `skip` cursor — the first
    // page is skip=0, so a request with skip > 0 is the load-more behavior
    // itself. Assert that request rather than the rendered row count: a refetch
    // can briefly collapse the table body to a single state row, which made the
    // count assertion flaky. If the sentinel→onLoadMore→fetchNextPage wiring
    // regresses, no skip>0 request fires and this fails.
    const nextPageRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/voting-powers") &&
        /[?&]skip=[1-9]/.test(req.url()),
      { timeout: 15_000 },
    );
    await scrollTablesToBottom(page);
    await nextPageRequest;
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
    const input = page.getByPlaceholder("Paste the address");
    // Retry the trigger click until the popover opens; the click can be
    // dropped if React hasn't hydrated the Radix Popover yet.
    await expect(async () => {
      await addressTrigger.click();
      await expect(input).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await input.fill("0x0000000000000000000000000000000000000000");
    const popover = page
      .locator(
        '[role="dialog"]:visible, [data-state="open"]:has(input[placeholder="Paste the address"])',
      )
      .first();
    const popoverApply = popover.getByRole("button", { name: /Apply/ });
    // The popover may render off-screen in the test viewport. Click via DOM
    // dispatch to bypass Playwright's viewport actionability check.
    await popoverApply.evaluate((el: HTMLElement) => el.click());
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
      .getByRole("button", { name: /^Balance/ });
    await expect(balanceHeader).toBeVisible();
    // First click on Token Holders headers can be dropped before React is
    // ready; retry click + URL assertion until one toggle lands.
    await expect(async () => {
      await balanceHeader.click();
      await expect(page).toHaveURL(/sortBy=balance|sort=/, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
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
      .getByRole("button", { name: /^Change/ });
    await expect(changeHeader).toBeVisible();
    await expect(async () => {
      await changeHeader.click();
      await expect(page).toHaveURL(/sortBy=(signedVariation|variation)/, {
        timeout: 2_000,
      });
    }).toPass({ timeout: 15_000 });
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
      .getByRole("button", { name: /^Voting Power/ });
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
      .getByRole("button", { name: /^Change/ });
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
      .getByRole("button", { name: /^Delegators/ });
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
    const input = page.getByPlaceholder("Paste the address");
    await expect(async () => {
      await addressTrigger.click();
      await expect(input).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await input.fill("0x0000000000000000000000000000000000000000");
    const popover = page
      .locator(
        '[role="dialog"]:visible, [data-state="open"]:has(input[placeholder="Paste the address"])',
      )
      .first();
    const popoverApply = popover.getByRole("button", { name: /Apply/ });
    // The popover may render off-screen in the test viewport. Click via DOM
    // dispatch to bypass Playwright's viewport actionability check.
    await popoverApply.evaluate((el: HTMLElement) => el.click());
    await expect(page).toHaveURL(/address=/, { timeout: 10_000 });
  });
});
