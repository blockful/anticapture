import { test, expect } from "./fixtures";

/* Desktop width, but short: the layout-sensitive tests below all need the
 * page to scroll vertically past the table. */
const SHORT_DESKTOP_VIEWPORT = { width: 1920, height: 640 };

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
    await page.setViewportSize(SHORT_DESKTOP_VIEWPORT);
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

    // The table is no longer an inner scroll box: its container never clips
    // rows behind its own scrollbar (the row count alone sets its height,
    // which may be under the viewport height as DAOs come and go), and
    // `main` is what scrolls.
    await expect
      .poll(() =>
        tableContainer.evaluate(
          (element) => element.scrollHeight - element.clientHeight,
        ),
      )
      .toBeLessThanOrEqual(0);
    await expect
      .poll(() =>
        page
          .locator("main")
          .evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);
  });

  // 1024 exercises the lg band, where the sidebar is up but headers may
  // wrap; 1920 exercises the roomy layout. The header must pin in both.
  for (const width of [1024, SHORT_DESKTOP_VIEWPORT.width]) {
    test(`keeps the table header pinned while the ${width}px desktop page scrolls`, async ({
      goto,
      page,
    }) => {
      await page.setViewportSize({
        width,
        height: SHORT_DESKTOP_VIEWPORT.height,
      });
      await page.route("**/api/user/api/auth/get-session", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "null",
        }),
      );
      await goto("/");

      await expect(page.locator("table thead").first()).toBeVisible({
        timeout: 15_000,
      });

      // Metric cells stream in after load and keep growing the page, so the
      // scroll, its precondition, and the header measurement all happen inside
      // one polled evaluation: park the table top 150px above the scrollport
      // of `main` (the page scroller) — never "scroll to bottom", sections
      // after the table would push it entirely off screen — then read where
      // the sticky header rests.
      const positions = () =>
        page.locator("main").evaluate((main) => {
          const table = main.querySelector("table");
          const thead = table?.querySelector("thead");
          if (!table || !thead)
            return { tableTop: NaN, theadTop: NaN, mainOverflowX: NaN };
          main.scrollTop +=
            table.getBoundingClientRect().top -
            main.getBoundingClientRect().top +
            150;
          return {
            tableTop: table.getBoundingClientRect().top,
            theadTop: thead.getBoundingClientRect().top,
            mainOverflowX: main.scrollWidth - main.clientWidth,
          };
        });

      await expect
        .poll(async () => (await positions()).tableTop, { timeout: 15_000 })
        .toBeLessThan(0);

      const { tableTop, theadTop, mainOverflowX } = await positions();
      expect(tableTop).toBeLessThan(0);
      // Pinned means resting at the top of the scrollport (sticky -top-px).
      expect(theadTop).toBeGreaterThanOrEqual(-2);
      expect(theadTop).toBeLessThanOrEqual(2);
      // The un-scrollported table must not leak a page-level horizontal
      // scrollbar; column headers wrap below xl to keep this true.
      expect(mainOverflowX).toBe(0);
    });
  }

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
