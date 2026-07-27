import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["html"], ["list"]] : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\/synthetic\//,
    },
    // Scheduled smoke probes against a live deployment; run with
    // PLAYWRIGHT_BASE_URL set (see .github/workflows/synthetic-monitoring.yaml).
    {
      name: "synthetic",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /\/synthetic\/.*\.spec\.ts$/,
    },
  ],
  // Skip webServer when PLAYWRIGHT_BASE_URL points to a remote target.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
