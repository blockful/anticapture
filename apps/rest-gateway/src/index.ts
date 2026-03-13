import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { addressEnrichment } from "./address-enrichment/route.js";
import { config } from "./config.js";
import { daos } from "./daos/route.js";
import { DaosService } from "./daos/service.js";
import { averageDelegation } from "./delegation/route.js";
import { DelegationService } from "./delegation/service.js";
import { health } from "./health/route.js";
import { proxy } from "./proxy/route.js";
import { mergeUpstreamDocs } from "./upstream-docs.js";

const app = new OpenAPIHono();

app.use("*", cors({ origin: "*" }));
app.use("*", logger());
const daosService = new DaosService(config.daoApis);
const delegationService = new DelegationService(config.daoApis);

console.log(
  `Discovered ${config.daoApis.size} DAO APIs:`,
  Array.from(config.daoApis.keys()),
);

// OpenAPI routes
health(app);
daos(app, daosService);
averageDelegation(app, delegationService);
addressEnrichment(app, config.addressEnrichmentUrl);

// OpenAPI docs
app.get("/docs/json", async (c) => {
  const ownSpec = app.getOpenAPI31Document({
    openapi: "3.1.0",
    info: { title: "Anticapture REST Gateway", version: "1.0.0" },
  });

  const merged = await mergeUpstreamDocs(ownSpec, config.daoApis);
  return c.json(merged);
});
app.get("/docs", swaggerUI({ url: "/docs/json" }));

// Proxy catch-all (must be last)
proxy(app, config.daoApis);

console.log(`🚀 REST Gateway running`);

serve({ fetch: app.fetch, port: config.port });

export { app };
