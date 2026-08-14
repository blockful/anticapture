import { test, expect } from "./fixtures";

test.describe("Panel page", () => {
  test(
    "renders the panel hero heading and description",
    { tag: "@smoke" },
    async ({ goto, page }) => {
      await goto("/");
      await expect(
        page
          .locator("h1")
          .filter({ hasText: "See which DAOs could be captured" }),
      ).toBeVisible();
      await expect(
        page.locator("text=Live governance-security risk for every DAO"),
      ).toBeVisible();
    },
  );

  test(
    "renders Monitored DAOs sub-section",
    { tag: "@smoke" },
    async ({ goto, page }) => {
      await goto("/");
      await expect(
        page.locator("p").filter({ hasText: "Monitored DAOs" }),
      ).toBeVisible({ timeout: 15_000 });
    },
  );

  test("ENS row links to /ens", async ({ goto, page }) => {
    await goto("/");
    const ensLink = page.locator('a[href="/ens"]').first();
    await expect(ensLink).toBeVisible({ timeout: 15_000 });
    await ensLink.click();
    // First navigation compiles /ens on demand under the dev webServer, so the
    // URL only commits once the RSC payload resolves — with parallel workers
    // competing for the compiler this can take tens of seconds.
    await expect(page).toHaveURL(/\/ens(\?.*)?$/, { timeout: 30_000 });
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

  test("keeps the Monitored DAOs table above the footer in a short viewport", async ({
    goto,
    page,
  }) => {
    const shortViewport = { width: 1920, height: 640 };
    await page.setViewportSize(shortViewport);
    await page.route("**/api/user/api/auth/get-session", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      }),
    );
    await goto("/");

    const tableContainer = page.locator("table").first().locator("..");
    const footer = page.locator("footer");
    await expect(tableContainer).toBeVisible({ timeout: 15_000 });
    await expect(footer).toBeVisible();

    const tableBox = await tableContainer.boundingBox();
    const footerBox = await footer.boundingBox();

    expect(tableBox).not.toBeNull();
    expect(footerBox).not.toBeNull();
    expect(tableBox!.y + tableBox!.height).toBeLessThanOrEqual(footerBox!.y);

    // The table is no longer an inner scroll box: every row lays out at full
    // height, past the bottom of this viewport, and `main` is what scrolls.
    await expect
      .poll(() => tableContainer.evaluate((element) => element.clientHeight))
      .toBeGreaterThan(shortViewport.height);
    await expect
      .poll(() =>
        page
          .locator("main")
          .evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);
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
