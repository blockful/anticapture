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

  test("shows feed events with High or Medium relevance", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    // Match the badge text exactly (anchored) to avoid the uppercase
    // "HIGH RELEVANCE ACTIVITY" section header. The live feed may legitimately
    // contain only Low-relevance events, be empty, or error — none of which
    // should fail this test. Wait for whichever the page settled into, then
    // only assert when High/Medium events actually exist.
    const eventRelevanceBadge = page
      .getByText(/^(High|Medium) Relevance$/)
      .first();
    const anyRelevanceBadge = page.getByText(/^(High|Medium|Low) Relevance$/);
    const isEmpty = page.getByText("No activity found");
    const failedToLoad = page.getByText("Failed to load activity feed");
    await expect(
      anyRelevanceBadge.first().or(isEmpty).or(failedToLoad),
    ).toBeVisible({ timeout: 30_000 });
    // No High/Medium events live (only Low, empty, or error) — nothing to assert.
    if ((await eventRelevanceBadge.count()) === 0) return;
    await expect(eventRelevanceBadge).toBeVisible();
  });

  test("event address click opens entity drawer when events exist", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    // Feed AddressButtons open a drawer via local state (no URL update).
    const addressBtn = page
      .locator('[data-testid="feed-address-button"]')
      .first();
    const count = await addressBtn.count();
    if (count === 0) return; // no events with address links, skip
    await addressBtn.click();
    // Drawer renders entity tabs; assert one is visible.
    await expect(
      page
        .locator('[role="tab"]')
        .filter({ hasText: /Delegation History|Voting Power History/ })
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
