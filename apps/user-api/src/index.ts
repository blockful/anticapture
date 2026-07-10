import { serve } from "@hono/node-server";

import { createApp } from "@/app";
import { authResolver } from "@/auth-instance";
import { AuthfulHttpClient } from "@/clients/authful";
import { db } from "@/database";
import { env } from "@/env";
import { logger } from "@/logger";
import { ApiKeysRepository } from "@/repositories/api-keys";
import { DraftsRepository } from "@/repositories/drafts";
import { ApiKeysService } from "@/services/api-keys";
import { DraftsService } from "@/services/drafts";

// Self-service API keys are enabled only when Authful provisioning is wired
// (env validation guarantees the pair is set together).
const apiKeysService =
  env.AUTHFUL_URL && env.AUTHFUL_PROVISIONING_API_KEY
    ? new ApiKeysService(
        new ApiKeysRepository(db),
        new AuthfulHttpClient(
          env.AUTHFUL_URL,
          env.AUTHFUL_PROVISIONING_API_KEY,
        ),
      )
    : undefined;

const app = createApp({
  db,
  authResolver,
  draftsService: new DraftsService(new DraftsRepository(db)),
  apiKeysService,
});

app.doc("/docs/json", {
  openapi: "3.1.0",
  info: { title: "Anticapture User API", version: "1.0.0" },
});

logger.info({ port: env.PORT }, "User API running");

serve({ fetch: app.fetch, port: env.PORT, hostname: "::" });

export { app };
