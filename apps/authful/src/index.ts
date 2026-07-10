import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { drizzle } from "drizzle-orm/node-postgres";

import { createApp } from "@/app";
import * as schema from "@/database/schema";
import { env, isPreview } from "@/env";
import { logger } from "@/logger";
import { TokensRepository } from "@/repositories/tokens";
import { TokensService } from "@/services/tokens";

const db = drizzle(env.DATABASE_URL, { schema });
const service = new TokensService(new TokensRepository(db));

// Fixed identity for the CI/preview seed token. Only the plaintext value varies
// (and only across previews), so it's the lone env var; the rest are constants.
// Rate limit is omitted so the DB default (600/min) applies.
const SEED_TOKEN_TENANT = "ci";
const SEED_TOKEN_NAME = "ci seed token";

// CI/preview bootstrap: seed a fixed, env-provided token so the rest of the
// preview stack can authenticate with a known key. `env` validation guarantees
// SEED_TOKEN_PLAINTEXT is set when `isPreview`. Idempotent and non-fatal.
if (isPreview && env.SEED_TOKEN_PLAINTEXT) {
  try {
    const { created } = await service.seed({
      plaintext: env.SEED_TOKEN_PLAINTEXT,
      tenant: SEED_TOKEN_TENANT,
      name: SEED_TOKEN_NAME,
    });
    logger.info(
      { tenant: SEED_TOKEN_TENANT, name: SEED_TOKEN_NAME, created },
      created ? "Seeded CI token" : "CI token already present — skipped seed",
    );
  } catch (err) {
    logger.error({ err }, "Failed to seed CI token");
  }
}

const app = createApp({
  service,
  db,
  adminApiKey: env.ADMIN_API_KEY,
  internalApiKey: env.INTERNAL_API_KEY,
  provisioningApiKey: env.PROVISIONING_API_KEY,
});

app.doc("/docs/json", {
  openapi: "3.1.0",
  info: { title: "Anticapture Authful API", version: "1.0.0" },
});
app.get("/docs", swaggerUI({ url: "/docs/json" }));

logger.info({ port: env.PORT }, "Authful API running");

serve({ fetch: app.fetch, port: env.PORT, hostname: "::" });

export { app };
