import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { drizzle } from "drizzle-orm/node-postgres";

import { createApp } from "@/app";
import * as schema from "@/database/schema";
import { env } from "@/env";
import { logger } from "@/logger";
import { TokensRepository } from "@/repositories/tokens";
import { TokensService } from "@/services/tokens";

const db = drizzle(env.DATABASE_URL, { schema });
const service = new TokensService(new TokensRepository(db));

const app = createApp({
  service,
  adminApiKey: env.ADMIN_API_KEY,
  internalApiKey: env.INTERNAL_API_KEY,
});

app.doc("/docs/json", {
  openapi: "3.1.0",
  info: { title: "Anticapture Tokenful API", version: "1.0.0" },
});
app.get("/docs", swaggerUI({ url: "/docs/json" }));

logger.info({ port: env.PORT }, "Tokenful API running");

serve({ fetch: app.fetch, port: env.PORT, hostname: "::" });

export { app };
