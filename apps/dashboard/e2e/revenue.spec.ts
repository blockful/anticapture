import { test, expect } from "./fixtures";

test.describe("Revenue page (/ens/revenue)", () => {
  test("renders run-rate summary and chart granularity controls", async ({
    goto,
    page,
  }) => {
    await goto("/ens/revenue");

    await expect(page.locator("h4").filter({ hasText: "Revenue" })).toBeVisible(
      { timeout: 15_000 },
    );
    await expect(page.getByText("Protocol Revenue (actual)")).toBeVisible();
    await expect(page.getByText("Annual run rate (projected)")).toBeVisible();
    await expect(page.getByText("All Time Revenue by Stream")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Quarter" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(
      page.getByRole("radio", { name: "1Y" }).first(),
    ).toHaveAttribute("aria-checked", "true");
  });

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
});
