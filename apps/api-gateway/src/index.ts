import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { daosRoute } from "./routes/v1/daos.js";
import { delegatedPercentageRoute } from "./routes/v1/delegated-percentage.js";
import { proxyRoute } from "./routes/proxy.js";
import { getRegisteredDaos } from "./dao-registry.js";

const app = new Hono();

// Middleware
app.use("*", logger());

// Aggregated routes (must be registered before the catch-all proxy)
app.route("/v1", daosRoute);
app.route("/v1", delegatedPercentageRoute);

// Transparent proxy for all other DAO-specific routes
app.route("/", proxyRoute);

// Health check
app.get("/health", (c) => {
  const daos = getRegisteredDaos();
  return c.json({
    status: "ok",
    daos: [...daos.keys()],
  });
});

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port, hostname: "::" }, () => {
  const daos = getRegisteredDaos();
  console.log(`Gateway running on http://localhost:${port}`);
  console.log(`Registered DAOs: ${[...daos.keys()].join(", ") || "none"}`);
});
