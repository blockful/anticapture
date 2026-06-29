import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import { ArkhamClient } from "@/clients/arkham";
import { ENSClient } from "@/clients/ens";
import { addressController } from "@/controllers/address";
import { initDb } from "@/db";
import { env } from "@/env";
import { logger } from "@/logger";
import { EnrichmentService } from "@/services/enrichment";

// Initialize clients and services
const arkhamClient = new ArkhamClient(env.ARKHAM_API_URL, env.ARKHAM_API_KEY);
const ensClient = new ENSClient();
const enrichmentService = new EnrichmentService(
  arkhamClient,
  ensClient,
  env.RPC_URL,
  env.ENS_CACHE_TTL_MINUTES,
);

// Create Hono app
const app = new Hono();

// Middleware
app.use(async (c, next) => {
  const start = Date.now();
  let status: number | undefined;
  try {
    await next();
  } catch (err) {
    status = err instanceof HTTPException ? err.status : 500;
    throw err;
  } finally {
    logger.info(
      {
        method: c.req.method,
        url: c.req.path,
        status: status ?? c.res?.status ?? 500,
        durationMs: Date.now() - start,
      },
      "request",
    );
  }
});
app.use(
  cors({
    origin: "*",
  }),
);

app.onError((err, c) => {
  logger.error(
    { err, url: c.req.path, method: c.req.method },
    "unhandled error",
  );
  return c.json(
    {
      error: "Internal server error",
      message: err.message ?? "Unknown error occurred",
    },
    500,
  );
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Register controllers
addressController(app, enrichmentService);

// OpenAPI documentation
app.doc("/docs/json", {
  openapi: "3.0.0",
  info: {
    title: "Address Enrichment API",
    version: "0.1.0",
    description:
      "API for enriching Ethereum addresses with labels and type information",
  },
});

app.get("/docs", swaggerUI({ url: "/docs/json" }));

// Run migrations then start server
initDb(env.DATABASE_URL);
// runMigrations(env.DATABASE_URL);
logger.info({ port: env.PORT }, "address enrichment API starting");
serve({
  fetch: app.fetch,
  port: env.PORT,
});

logger.info(
  { url: `http://localhost:${env.PORT}/docs` },
  "API documentation available",
);
