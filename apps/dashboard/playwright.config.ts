import path from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "playwright/test";

// The /api/gateful proxy reads ANTICAPTURE_API_URL, which lives in the repo
// root .env when running the orchestrated stack; Next only auto-loads the
// app-local env files, so pull the root one in as a fallback (dotenv never
// overrides variables that are already set).
loadEnv({ path: path.resolve(__dirname, "../../.env") });

import { BASE_URL, E2E_PORT, REMOTE_BASE_URL } from "./e2e/helpers/base-url";

const IS_CHECKLY = process.env.CHECKLY === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI || IS_CHECKLY ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["html"], ["list"]] : "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Skip webServer when targeting a remote deployment.
  webServer: REMOTE_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --port ${E2E_PORT}`,
        url: `http://localhost:${E2E_PORT}`,
        reuseExistingServer: !process.env.CI,
        // Cold turbopack compile on a 2-core CI runner can exceed 3 minutes.
        timeout: 300_000,
      },
});
