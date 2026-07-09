import { serve } from "@hono/node-server";

import { createApp } from "@/app";
import { authResolver } from "@/auth-instance";
import { db } from "@/database";
import { env } from "@/env";
import { logger } from "@/logger";
import { DraftsRepository } from "@/repositories/drafts";
import { DraftsService } from "@/services/drafts";

const app = createApp({
  db,
  authResolver,
  draftsService: new DraftsService(new DraftsRepository(db)),
});

app.doc("/docs/json", {
  openapi: "3.1.0",
  info: { title: "Anticapture User API", version: "1.0.0" },
});

logger.info({ port: env.PORT }, "User API running");

serve({ fetch: app.fetch, port: env.PORT, hostname: "::" });

export { app };
