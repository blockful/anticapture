import type { Page } from "playwright/test";

import { test, expect } from "./fixtures";

test.describe("Revenue page (/ens/revenue)", () => {
  test(
    "renders run-rate summary and chart granularity controls",
    { tag: "@smoke" },
    async ({ goto, page }) => {
      await goto("/ens/revenue");

      await expect(
        page.locator("h4").filter({ hasText: "Revenue" }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Protocol Revenue (actual)")).toBeVisible();
      await expect(page.getByText("Annualized run rate")).toBeVisible();
      await expect(page.getByText("All Time Revenue by Stream")).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Quarter" }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByRole("radio", { name: "1Y" }).first(),
      ).toHaveAttribute("aria-checked", "true");
    },
  );

  test("uses native selects for summary and chart controls on mobile", async ({
    goto,
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await goto("/ens/revenue");

    await expect(page.getByText("Protocol Revenue (actual)")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("select").first()).toHaveValue("1y");
    await expect(page.locator("select").nth(1)).toHaveValue("quarter");
  });

  test.describe("links to a block", () => {
    /** Slugs of the blocks whose border pulsed, recorded from the first frame. */
    const pulsedBlocks = (page: Page) =>
      page.evaluate(
        () => (window as unknown as { __pulsed: string[] }).__pulsed,
      );

    test.beforeEach(async ({ page }) => {
      // The pulse lasts under two seconds, so it is recorded as it happens
      // instead of being looked for afterwards.
      await page.addInitScript(() => {
        const pulsed: string[] = [];
        (window as unknown as { __pulsed: string[] }).__pulsed = pulsed;
        new MutationObserver((records) => {
          for (const { target } of records) {
            if (!(target instanceof Element)) continue;
            const slug = target.getAttribute("data-deep-link");
            if (
              slug &&
              target.hasAttribute("data-deep-link-pulse") &&
              !pulsed.includes(slug)
            ) {
              pulsed.push(slug);
            }
          }
        }).observe(document, {
          subtree: true,
          attributes: true,
          attributeFilter: ["data-deep-link-pulse"],
        });
      });
    });

    test("opens the page at the block and pulses its border", async ({
      goto,
      page,
    }) => {
      await goto("/ens/revenue#renewal-rate-by-year");

      await expect(
        page.locator('[data-deep-link="renewal-rate-by-year"]'),
      ).toBeInViewport({ timeout: 15_000 });
      await expect
        .poll(() => pulsedBlocks(page), { timeout: 15_000 })
        .toEqual(["renewal-rate-by-year"]);
    });

    test("lands clear of the fixed header on a phone", async ({
      goto,
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await goto("/ens/revenue#renewal-rate");

      await expect
        .poll(() => pulsedBlocks(page), { timeout: 15_000 })
        .toEqual(["renewal-rate"]);
      // Polled: a card that finishes loading right then moves the block for
      // a moment, and the arrival puts it back.
      const position = () =>
        page.evaluate(() => {
          const block = document
            .querySelector('[data-deep-link="renewal-rate"]')!
            .getBoundingClientRect();
          const headerBottom = Math.max(
            0,
            ...[...document.querySelectorAll("header")]
              .filter((header) => getComputedStyle(header).position === "fixed")
              .map((header) => header.getBoundingClientRect().bottom),
          );
          return {
            belowHeader: block.top >= headerBottom,
            aboveFold: block.bottom <= window.innerHeight,
          };
        });
      await expect
        .poll(position, { timeout: 15_000 })
        .toEqual({ belowHeader: true, aboveFold: true });
    });

    test("a title puts the link to its block in the address bar and copies it", async ({
      goto,
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await goto("/ens/revenue");

      // Cards that are still loading change height and move the page, which
      // would read as a scroll: wait for all of them first.
      await expect(page.locator("main .animate-pulse")).toHaveCount(0, {
        timeout: 30_000,
      });
      const title = page.getByRole("link", { name: "Upcoming Expirations" });
      await title.scrollIntoViewIfNeeded();
      const titleTop = async () => (await title.boundingBox())!.y;
      const before = await titleTop();

      await title.click();

      // First: the confirmation is on the page for two seconds only.
      await expect(
        page.getByRole("status").filter({ hasText: "Link copied" }),
      ).toHaveCount(1);
      await expect(page).toHaveURL(/\/ens\/revenue#upcoming-expirations$/);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
        /\/ens\/revenue#upcoming-expirations$/,
      );
      // Copying a link is not a visit: the page stays where it was and
      // nothing pulses.
      expect(Math.abs((await titleTop()) - before)).toBeLessThanOrEqual(1);
      expect(await pulsedBlocks(page)).toEqual([]);
    });
  });
});
