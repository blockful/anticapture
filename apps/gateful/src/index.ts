import dns from "node:dns";

import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { config } from "./config.js";
import { CircuitOpenError } from "./shared/circuit-breaker.js";
import { createRedisClient } from "./cache/redis.js";
import { cacheMiddleware } from "./middlewares/cache.js";
import { health } from "./health/route.js";
import { proxy } from "./proxy/route.js";
import { addressEnrichment } from "./resolvers/address-enrichment/route.js";
import { daos } from "./resolvers/daos/route.js";
import { DaosService } from "./resolvers/daos/service.js";
import { averageDelegation } from "./resolvers/delegation/route.js";
import { DelegationService } from "./resolvers/delegation/service.js";
import { CircuitBreakerRegistry } from "./shared/circuit-breaker-registry.js";
import { mergeUpstreamDocs } from "./upstream-docs.js";

// "verbatim" preserves the DNS response order so AAAA records
// are used directly, allowing fetch() to resolve *.railway.internal correctly.
dns.setDefaultResultOrder("verbatim");

const app = new OpenAPIHono();

app.onError((err, c) => {
  if (err instanceof CircuitOpenError)
    return c.json({ error: "DAO service temporarily unavailable" }, 503);
  return c.json({ error: "Internal server error" }, 500);
});

app.use("*", cors({ origin: "*" }));
app.use("*", logger());
if (config.blockfulApiToken) {
  app.use("*", bearerAuth({ token: config.blockfulApiToken }));
}
if (config.redisUrl) {
  const redis = createRedisClient(config.redisUrl);
  app.use("*", cacheMiddleware(redis));
}

console.log(
  `Discovered ${config.daoApis.size} DAO APIs: [${Array.from(config.daoApis.keys()).join(", ")}]`,
);

const registry = new CircuitBreakerRegistry(config.circuitBreaker);

// OpenAPI routes
health(app, registry);
addressEnrichment(app, config.addressEnrichmentUrl);

// Aggregation routes
const daosService = new DaosService(config.daoApis, registry);
const delegationService = new DelegationService(config.daoApis, registry);

daos(app, daosService);
averageDelegation(app, delegationService);

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
proxy(app, config.daoApis, registry);

console.log(`🚀 REST Gateway running`);

serve({ fetch: app.fetch, port: config.port, hostname: "::" });

export { app };
