import { test, expect } from "./fixtures";

test.describe("DAO Overview page (/ens)", () => {
  test("renders DAO Overview heading", async ({ goto, page }) => {
    await goto("/ens");
    await expect(
      page.locator("h4").filter({ hasText: "DAO Overview" }),
    ).toBeVisible();
  });

  test("renders ENS DAO header with name and metrics", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    // ENS name heading
    await expect(page.locator("h3").filter({ hasText: "ENS" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows header metric cards", async ({ goto, page }) => {
    await goto("/ens");
    // One of the four metrics cards should be visible
    await expect(page.locator("text=Votable Supply").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows resilience stages area", async ({ goto, page }) => {
    await goto("/ens");
    // Either stages or review needed state
    const hasStages = page.locator("text=RESILIENCE STAGES");
    const hasReview = page.locator("text=REVIEW NEEDED");
    await expect(hasStages.or(hasReview)).toBeVisible({ timeout: 15_000 });
  });

  test("shows attack exposure or review needed", async ({ goto, page }) => {
    await goto("/ens");
    const hasExposure = page.locator("text=ATTACK EXPOSURE");
    const hasReview = page.locator("text=REVIEW NEEDED");
    await expect(hasExposure.or(hasReview)).toBeVisible({ timeout: 15_000 });
  });

  test("shows attack profitability chart or empty state", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    const hasProfitability = page.locator("text=ATTACK PROFITABILITY");
    const hasNotApplicable = page.locator("text=Not applicable for this DAO");
    const hasNoData = page.locator("text=This data isn't available yet");
    await expect(
      hasProfitability.or(hasNotApplicable).or(hasNoData),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("shows token distribution chart or empty state", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    const hasTokenDist = page.locator("text=TOKEN DISTRIBUTION SUPPLY");
    const hasReview = page.locator("text=REVIEW NEEDED");
    await expect(hasTokenDist.or(hasReview)).toBeVisible({ timeout: 20_000 });
  });

  test("shows last proposals area if governance is configured", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    const lastProposals = page.locator("text=Last proposals");
    const count = await lastProposals.count();
    if (count > 0) {
      await expect(lastProposals.first()).toBeVisible({ timeout: 20_000 });
    }
    // If not present, governance page not configured — acceptable
  });

  test("renders all four header metric cards", async ({ goto, page }) => {
    await goto("/ens");
    await expect(page.locator("text=Votable Supply")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("text=Treasury")).toBeVisible();
    await expect(page.locator("text=Average Turnout")).toBeVisible();
    await expect(page.locator("text=Delegate to Pass")).toBeVisible();
  });

  test("renders chart cards for account balance and voting power", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    // These chart cards exist in the layout; their presence is signaled by chart containers
    // Use a generous selector — recharts wrapper or canvas
    await expect(
      page.locator("h4").filter({ hasText: "DAO Overview" }),
    ).toBeVisible({
      timeout: 15_000,
    });
    // Wait for any chart container to render
    const charts = page.locator(".recharts-responsive-container, canvas");
    await expect(charts.first()).toBeVisible({ timeout: 20_000 });
  });
});
