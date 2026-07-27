import { test, expect } from "@/e2e/fixtures";

/**
 * Synthetic monitoring smoke suite. Runs on a schedule against the live
 * deployment (PLAYWRIGHT_BASE_URL, see synthetic-monitoring.yaml) to catch
 * outages a plain HTTP health check can't: broken hydration, a dead gateway
 * data path, or a route that 500s only in the browser.
 *
 * Keep it small and fast — critical journeys only. Feature-level assertions
 * belong in the regular e2e suite.
 */
test.describe("Synthetic monitoring smoke", () => {
  test("Panel (/) renders and lists monitored DAOs", async ({ goto, page }) => {
    await goto("/");
    await expect(page.locator("h4").filter({ hasText: "Panel" })).toBeVisible({
      timeout: 15_000,
    });
    // A DAO row proves the panel received live data, not just a shell.
    await expect(page.locator('a[href="/ens"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("DAO Overview (/ens) renders header and live metrics", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    await expect(page.locator("h3").filter({ hasText: "ENS" })).toBeVisible({
      timeout: 15_000,
    });
    // A metric card proves the gateway → API → DB path is serving data.
    await expect(page.locator("text=Votable Supply").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Proposals (/ens/proposals) renders", async ({ goto, page }) => {
    await goto("/ens/proposals");
    await expect(
      page.locator("h4").filter({ hasText: "Proposals" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Holders & Delegates (/ens/holders-and-delegates) renders", async ({
    goto,
    page,
  }) => {
    await goto("/ens/holders-and-delegates");
    await expect(
      page.locator("h4").filter({ hasText: "Holders & Delegates" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("synthetic traffic stays out of Umami analytics", async ({
    goto,
    page,
  }) => {
    // Aborted requests never fire "requestfinished", so anything recorded
    // here actually escaped to Umami's servers.
    const escaped: string[] = [];
    page.on("requestfinished", (request) => {
      if (new URL(request.url()).hostname.endsWith("umami.is")) {
        escaped.push(request.url());
      }
    });

    await goto("/");

    expect(escaped).toEqual([]);
    const optOut = await page.evaluate(() =>
      window.localStorage.getItem("umami.disabled"),
    );
    expect(optOut).toBe("1");
  });
});
