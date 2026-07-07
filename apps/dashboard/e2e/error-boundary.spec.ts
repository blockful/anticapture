import { test, expect } from "./fixtures";

test.describe("Route error boundary", () => {
  test("a render error shows the recovery UI and the shell survives", async ({
    goto,
    page,
  }) => {
    // ?forceError makes the page throw a client render error after hydration
    // (see ForceErrorTrigger), which the segment error.tsx must catch.
    await goto("/ens/activity-feed?forceError=1");

    const fallback = page.getByTestId("route-error-fallback");
    await expect(fallback).toBeVisible({ timeout: 15_000 });
    await expect(
      fallback.getByRole("button", { name: /try again/i }),
    ).toBeVisible();

    // The shell outside the boundary survives: desktop sidebar still rendered.
    await expect(page.locator("header").first()).toBeVisible();
    // The page content was replaced by the recovery UI, not a white screen.
    await expect(page.locator("h4", { hasText: "Activity Feed" })).toHaveCount(
      0,
    );
  });

  test("pages render normally without the forceError param", async ({
    goto,
    page,
  }) => {
    await goto("/ens/activity-feed");
    await expect(
      page.locator("h4").filter({ hasText: "Activity Feed" }),
    ).toBeVisible();
    await expect(page.getByTestId("route-error-fallback")).toHaveCount(0);
  });
});
