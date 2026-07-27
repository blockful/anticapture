import { serve } from "@hono/node-server";

import { createApp } from "@/app";
import { authResolver } from "@/auth-instance";
import { AuthfulHttpClient } from "@/clients/authful";
import { db } from "@/database";
import { env } from "@/env";
import { logger } from "@/logger";
import { registerValidationMetrics } from "@/metrics";
import { ApiKeysRepository } from "@/repositories/api-keys";
import { DraftsRepository } from "@/repositories/drafts";
import { ApiKeysService } from "@/services/api-keys";
import { ProposalDraftsService } from "@/services/drafts";
import {
  DatabaseMetricsDataSource,
  MetricsSnapshotService,
} from "@/services/metrics";

// Self-service API keys are enabled only when Authful provisioning is wired
// (env validation guarantees the pair is set together).
const authfulClient =
  env.AUTHFUL_URL && env.AUTHFUL_PROVISIONING_API_KEY
    ? new AuthfulHttpClient(env.AUTHFUL_URL, env.AUTHFUL_PROVISIONING_API_KEY)
    : undefined;

const apiKeysService = authfulClient
  ? new ApiKeysService(new ApiKeysRepository(db), authfulClient)
  : undefined;

const metricsService = authfulClient
  ? new MetricsSnapshotService(new DatabaseMetricsDataSource(db), authfulClient)
  : undefined;

const app = createApp({
  db,
  authResolver,
  draftsService: new ProposalDraftsService(new DraftsRepository(db)),
  apiKeysService,
  metricsToken: env.USER_API_METRICS_TOKEN,
});

app.doc("/docs/json", {
  openapi: "3.1.0",
  info: { title: "Anticapture User API", version: "1.0.0" },
});

logger.info({ port: env.PORT }, "User API running");

serve({ fetch: app.fetch, port: env.PORT, hostname: "::" });

// Refresh metrics after serving starts: a slow/unreachable Authful must not
// keep /health and the rest of the API unavailable long enough for Railway to
// restart the process. The interval retries on its own cadence.
if (metricsService) {
  registerValidationMetrics(metricsService);
  void metricsService.refresh().catch((err: unknown) => {
    logger.error({ err }, "Initial validation metrics refresh failed");
  });
  const refreshTimer = setInterval(() => {
    void metricsService.refresh().catch((err: unknown) => {
      logger.error({ err }, "Validation metrics refresh failed");
    });
  }, 60_000);
  refreshTimer.unref();
}

export { app };
