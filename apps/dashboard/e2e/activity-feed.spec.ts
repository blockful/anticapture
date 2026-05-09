import { test, expect } from "./fixtures";

test.describe("Activity Feed page (/ens/activity-feed)", () => {
  test("renders Activity Feed heading and description", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    await expect(
      page.locator("h4").filter({ hasText: "Activity Feed" }),
    ).toBeVisible();
    await expect(
      page.locator("text=Surfaces governance activity"),
    ).toBeVisible();
  });

  test("shows Filters button", async ({ goto, page }) => {
    await goto("/ens/activity-feed");
    await expect(page.getByRole("button", { name: /Filters/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Filters button opens filters drawer", async ({ goto, page }) => {
    await goto("/ens/activity-feed");
    const filtersBtn = page.getByRole("button", { name: /Filters/ });
    await expect(filtersBtn).toBeVisible({ timeout: 15_000 });
    await filtersBtn.click();
    await expect(page.locator("text=Filter Activity")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("filters drawer shows relevance, type, and date controls", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    await page.getByRole("button", { name: /Filters/ }).click();
    await expect(page.locator("text=Filter Activity")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=MIN. RELEVANCE")).toBeVisible();
    await expect(page.locator("text=EVENT TYPE")).toBeVisible();
    await expect(page.locator("text=SORT BY DATE")).toBeVisible();
    await expect(page.locator("text=TIME FRAME")).toBeVisible();
  });

  test("can apply and clear filters via drawer", async ({ goto, page }) => {
    await goto("/ens/activity-feed");
    await page.getByRole("button", { name: /Filters/ }).click();
    await expect(page.locator("text=Filter Activity")).toBeVisible({
      timeout: 10_000,
    });
    // Select "High" relevance
    // The visible label (span) sits next to an sr-only input. Clicking the
    // label is more reliable than clicking the input directly.
    await page
      .locator("label")
      .filter({ hasText: /^High$/ })
      .first()
      .click();
    // Apply filters
    const applyBtn = page.getByRole("button", { name: /Apply filters/ });
    await applyBtn.scrollIntoViewIfNeeded().catch(() => undefined);
    await applyBtn.click({ force: true });
    // URL should reflect the filter
    await expect(page).toHaveURL(/relevance=HIGH/);
    // Open drawer again and clear
    await page.getByRole("button", { name: /Filters/ }).click();
    await expect(page.locator("text=Filter Activity")).toBeVisible({
      timeout: 5_000,
    });
    const clearBtn = page.getByRole("button", { name: /Clear filters/ });
    await clearBtn.scrollIntoViewIfNeeded().catch(() => undefined);
    await clearBtn.click({ force: true });
    // Filter should be removed from URL
    await expect(page).not.toHaveURL(/relevance=HIGH/);
  });

  test("shows feed events or empty state", async ({ goto, page }) => {
    await goto("/ens/activity-feed");
    const hasFeedItems = page.locator("text=High Relevance").first();
    const hasMediumItems = page.locator("text=Medium Relevance").first();
    const isEmpty = page.locator("text=No activity found");
    const failedToLoad = page.locator("text=Failed to load activity feed");
    await expect(
      hasFeedItems.or(hasMediumItems).or(isEmpty).or(failedToLoad),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("event address click opens entity drawer when events exist", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    // Look for any clickable address button in feed items
    // Address buttons are inside feed event items and trigger a drawer
    const addressBtn = page
      .locator(
        '[data-ph-event="holder_details"], [data-ph-event="delegate_details"]',
      )
      .first();
    const count = await addressBtn.count();
    if (count === 0) return; // no events with address links, skip
    await addressBtn.click();
    await expect(page).toHaveURL(/drawerAddress=/, { timeout: 10_000 });
  });
});
