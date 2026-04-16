import dns from "node:dns";

import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { OpenAPIObject } from "openapi3-ts/oas31";

import { config } from "./config.js";
import { createRedisClient } from "./cache/redis.js";
import { cacheMiddleware } from "./middlewares/cache.js";
import { health } from "./health/route.js";
import { proxy } from "./proxy/route.js";
import { addressEnrichment } from "./resolvers/address-enrichment/route.js";
import { daos } from "./resolvers/daos/route.js";
import { DaosService } from "./resolvers/daos/service.js";
import { averageDelegation } from "./resolvers/delegation/route.js";
import { DelegationService } from "./resolvers/delegation/service.js";
import { storeOpenApiSpec } from "./upstream-docs.js";

// "verbatim" preserves the DNS response order so AAAA records
// are used directly, allowing fetch() to resolve *.railway.internal correctly.
dns.setDefaultResultOrder("verbatim");

const app = new OpenAPIHono();

app.use("*", cors({ origin: "*" }));
app.use("*", logger());
if (config.blockfulApiToken) {
  const requireBearerAuth = bearerAuth({ token: config.blockfulApiToken });

  app.use("*", async (c, next) => {
    if (c.req.path === "/docs" || c.req.path === "/docs/json") {
      await next();
      return;
    }

    return requireBearerAuth(c, next);
  });
}
if (config.redisUrl) {
  const redis = createRedisClient(config.redisUrl);
  app.use("*", cacheMiddleware(redis));
}

console.log(
  `Discovered ${config.daoApis.size} DAO APIs: [${Array.from(config.daoApis.keys()).join(", ")}]`,
);

// OpenAPI routes
health(app);
addressEnrichment(app, config.addressEnrichmentUrl);

// Aggregation routes
const daosService = new DaosService(config.daoApis);
const delegationService = new DelegationService(config.daoApis);

daos(app, daosService);
averageDelegation(app, delegationService);

// OpenAPI docs
const openApiDocument = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "Anticapture REST Gateway", version: "1.0.0" },
}) as OpenAPIObject;

openApiDocument.security = [{ bearerAuth: [] }];
openApiDocument.components = {
  ...openApiDocument.components,
  securitySchemes: {
    ...openApiDocument.components?.securitySchemes,
    bearerAuth: {
      type: "http",
      scheme: "bearer",
    },
  },
};

const getOpenApiSpec = storeOpenApiSpec(openApiDocument, config.daoApis);

app.get("/docs/json", async (c) => {
  return c.json(await getOpenApiSpec());
});
app.get("/docs", swaggerUI({ url: "/docs/json" }));

// Proxy catch-all (must be last)
proxy(app, config.daoApis);

console.log(`🚀 REST Gateway running`);

serve({ fetch: app.fetch, port: config.port, hostname: "::" });

export { app };
