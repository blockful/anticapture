import { defineConfig } from "checkly";
import { AlertChannel, Frequency } from "checkly/constructs";

// Channels are created/authorized in the Checkly UI (Slack needs an OAuth
// grant); the config subscribes to them by ID so a deploy never drops them.
const SLACK_ALERT_CHANNEL = AlertChannel.fromId(318090); // #anticapture-alerts-prod
const EMAIL_ALERT_CHANNEL = AlertChannel.fromId(318084); // shared@blockful.io

/**
 * Synthetic monitoring for the production dashboard (DEV-1132).
 *
 * The @smoke-tagged subset of the Playwright E2E suite runs hourly against
 * https://app.anticapture.com (the base URL switches automatically when
 * CHECKLY=1 — see playwright.config.ts). Hourly keeps the month at ~720 of
 * the free tier's 1,000 browser check runs.
 *
 * `checkly deploy` is the only sanctioned write path for this monitor; edits
 * made in the Checkly UI are overwritten on the next deploy. Alert channels
 * (Slack + email) are account-level settings configured in Checkly itself.
 */
export default defineConfig({
  projectName: "Anticapture Dashboard",
  logicalId: "anticapture-dashboard",
  checks: {
    playwrightConfigPath: "./playwright.config.ts",
    alertChannels: [SLACK_ALERT_CHANNEL, EMAIL_ALERT_CHANNEL],
    playwrightChecks: [
      {
        name: "Dashboard smoke (production)",
        logicalId: "dashboard-smoke-production",
        pwTags: ["@smoke"],
        frequency: Frequency.EVERY_1H,
        locations: ["us-east-1", "eu-west-1"],
      },
    ],
  },
  cli: {
    runLocation: "us-east-1",
  },
});
