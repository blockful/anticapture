import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { ArkhamClient } from "@/clients/arkham";
import { ENSClient } from "@/clients/ens";
import { addressController } from "@/controllers/address";
import { initDb } from "@/db";
import { env } from "@/env";
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
app.use(logger());
app.use(
  cors({
    origin: "*",
  }),
);

app.onError((err, c) => {
  console.error("Unhandled error:", err);
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
console.log(`🚀 Address Enrichment API starting on port ${env.PORT}`);
serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(
  `📚 API documentation available at http://localhost:${env.PORT}/docs`,
);
