import { expect, test } from "./fixtures";

test.describe("Data report", () => {
  test("submits a report from a panel flag icon", async ({ goto, page }) => {
    await goto("/ens/token-distribution");
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ message: "Report submitted successfully" }),
      });
    });

    await page.getByTestId("report-panel-button").click();
    await page
      .getByLabel("What looks incorrect?")
      .fill("The displayed supply is stale.");
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(page.getByText("Report received")).toBeVisible();
  });

  test("shows a friendly rate-limit error", async ({ goto, page }) => {
    await goto("/ens/token-distribution");
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Too many reports from this address. Please try again in an hour.",
        }),
      });
    });

    await page.getByTestId("report-panel-button").click();
    await page
      .getByLabel("What looks incorrect?")
      .fill("The displayed supply is stale.");
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(
      page.getByText(
        "Too many reports from this address. Please try again in an hour.",
      ),
    ).toBeVisible();
  });

  test("submits correct panel name when switching tabs", async ({
    goto,
    page,
  }) => {
    await goto("/ens/stakeholders");
    let reportPayload: Record<string, unknown> | null = null;
    await page.route("**/api/report", async (route) => {
      reportPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ message: "Report submitted successfully" }),
      });
    });

    // Delegates is the default tab; switch away so the payload proves the
    // panel name follows the active tab.
    const tokenHoldersTab = page.getByRole("tab", { name: "Token Holders" });
    await expect(tokenHoldersTab).toBeVisible({ timeout: 15_000 });
    await tokenHoldersTab.click();
    await expect(tokenHoldersTab).toHaveAttribute("aria-selected", "true");

    await page.getByTestId("report-panel-button").click();
    await page
      .getByLabel("What looks incorrect?")
      .fill("Token holder data looks wrong.");
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(page.getByText("Report received")).toBeVisible();
    expect(reportPayload).toMatchObject({
      daoId: "ens",
      panel: "Token Holders",
      description: "Token holder data looks wrong.",
      email: "",
    });
    expect(reportPayload).not.toHaveProperty("section");
    expect(reportPayload).toHaveProperty("url");
  });
});
