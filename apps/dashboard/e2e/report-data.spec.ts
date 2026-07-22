import { expect, test } from "./fixtures";

test.describe("Data report", () => {
  test("submits a report from a DAO section", async ({ goto, page }) => {
    await goto("/ens/token-distribution");
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ message: "Report submitted successfully" }),
      });
    });

    await page.getByTestId("report-data-button").click();
    await page
      .getByRole("combobox", { name: "Which panel is incorrect?" })
      .click();
    await page.getByRole("option", { name: "Token distribution" }).click();
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

    await page.getByTestId("report-data-button").click();
    await page
      .getByRole("combobox", { name: "Which panel is incorrect?" })
      .click();
    await page.getByRole("option", { name: "Token distribution" }).click();
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

  test("submits current section context after sidebar navigation", async ({
    goto,
    page,
  }) => {
    await goto("/ens");
    let reportPayload: Record<string, string> | null = null;
    await page.route("**/api/report", async (route) => {
      reportPayload = route.request().postDataJSON() as Record<string, string>;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ message: "Report submitted successfully" }),
      });
    });

    await page.getByRole("link", { name: /token distribution/i }).click();
    await page.getByTestId("report-data-button").click();
    await page
      .getByRole("combobox", { name: "Which panel is incorrect?" })
      .click();
    await page.getByRole("option", { name: "Token distribution" }).click();
    await page
      .getByLabel("What looks incorrect?")
      .fill("The displayed supply is stale.");
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(page.getByText("Report received")).toBeVisible();
    expect(reportPayload).toEqual({
      daoId: "ens",
      section: "token-distribution",
      panel: "Token distribution",
      description: "The displayed supply is stale.",
      email: "",
      url: "http://localhost:3000/ens/token-distribution",
    });
  });
});
