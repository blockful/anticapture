import "./instrumentation";

import dns from "node:dns";

import { collectPrometheusMetrics } from "@anticapture/observability";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { OpenAPIObject } from "openapi3-ts/oas31";

import { rateLimitMiddleware } from "./auth/rate-limit";
import { tokenAuthMiddleware } from "./auth/token-auth";
import { AuthfulClient } from "./auth/authful-client";
import { usageMiddleware } from "./auth/usage";
import { config } from "./config";
import { CircuitOpenError } from "./shared/circuit-breaker";
import { createRedisClient } from "./cache/redis";
import { exporter } from "./instrumentation";
import { logger } from "./logger";
import { cacheMiddleware } from "./middlewares/cache";
import { requestLogger } from "./middlewares/logger";
import { daoHealth } from "./health/dao";
import { metricsMiddleware } from "./middlewares/metrics";
import { health } from "./health/route";
import { proxy } from "./proxy/route";
import { relayerProxy } from "./proxy/relayer";
import { addressEnrichment } from "./resolvers/address-enrichment/route";
import { daos } from "./resolvers/daos/route";
import { DaosService } from "./resolvers/daos/service";
import { averageDelegation } from "./resolvers/delegation/route";
import { DelegationService } from "./resolvers/delegation/service";
import { CircuitBreakerRegistry } from "./shared/circuit-breaker-registry";
import { storeOpenApiSpec } from "./upstream-docs";

// "verbatim" preserves the DNS response order so AAAA records
// are used directly, allowing fetch() to resolve *.railway.internal correctly.
dns.setDefaultResultOrder("verbatim");

const app = new OpenAPIHono();

app.onError((err, c) => {
  if (err instanceof CircuitOpenError)
    return c.json({ error: "DAO service temporarily unavailable" }, 503);
  if (err instanceof HTTPException) return err.getResponse();
  return c.json({ error: "Internal server error" }, 500);
});

app.use("*", cors({ origin: "*" }));
app.use("*", requestLogger());
app.use("*", metricsMiddleware());

// Protect the public /metrics endpoint with a shared bearer so only our
// Prometheus scraper can read it. Registered before the route handler so the
// guard runs first; skipped entirely when GATEFUL_METRICS_TOKEN is unset (local dev).
if (config.metricsToken) {
  app.use("/metrics", bearerAuth({ token: config.metricsToken }));
}

app.get("/metrics", async (c) => {
  const { body, contentType } = await collectPrometheusMetrics(exporter);
  return c.body(body, 200, { "Content-Type": contentType });
});

logger.info(
  config.metricsToken
    ? "metrics endpoint protected by bearer token"
    : "metrics endpoint is unauthenticated (GATEFUL_METRICS_TOKEN unset)",
);

const PUBLIC_PATHS = new Set(["/docs", "/docs/json", "/health", "/metrics"]);

const redis = config.redisUrl ? createRedisClient(config.redisUrl) : undefined;

// Fail closed: without a configured token service, every DAO/relayer route
// would be public. Refuse to start unless auth is explicitly opted out via
// GATEFUL_AUTH_DISABLED (local dev only).
if (!config.tokenService && !config.authDisabled) {
  throw new Error(
    "Per-tenant auth is not configured (TOKEN_SERVICE_URL unset). Set it, or set GATEFUL_AUTH_DISABLED=true to run without auth (local dev only).",
  );
}

if (config.tokenService) {
  const authfulClient = new AuthfulClient(
    config.tokenService.url,
    config.tokenService.apiKey,
  );

  app.use(
    "*",
    tokenAuthMiddleware({
      client: authfulClient,
      cache: redis,
      publicPaths: PUBLIC_PATHS,
    }),
  );
  // Usage is registered before rate limiting so its `finally` still counts
  // requests that the rate limiter rejects with 429.
  app.use("*", usageMiddleware(config.daoApis));
  app.use("*", rateLimitMiddleware(redis));

  logger.info("per-tenant token auth enabled (Authful)");
}
if (redis) {
  app.use("*", cacheMiddleware(redis, config.daoApis));
}

logger.info(
  {
    daoApis: Array.from(config.daoApis.keys()),
    addressEnrichmentUrl: config.addressEnrichmentUrl ?? null,
  },
  `discovered ${config.daoApis.size} DAO APIs${
    config.addressEnrichmentUrl ? " + address enrichment" : ""
  }`,
);

const registry = new CircuitBreakerRegistry(config.circuitBreaker);

// OpenAPI routes
health(app, registry, {
  daoApis: config.daoApis,
  daoRelayers: config.daoRelayers,
  addressEnrichmentUrl: config.addressEnrichmentUrl,
  tokenServiceUrl: config.tokenService?.url,
  commitSha: config.commitSha,
});
daoHealth(app, config.daoApis, registry);
addressEnrichment(app, config.addressEnrichmentUrl, registry);

// Aggregation routes
const daosService = new DaosService(config.daoApis, registry);
const delegationService = new DelegationService(config.daoApis, registry);

daos(app, daosService);
averageDelegation(app, delegationService);

// OpenAPI docs
const openApiDocument = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "Anticapture Gateful REST API", version: "1.0.0" },
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

const getOpenApiSpec = storeOpenApiSpec(
  openApiDocument,
  config.daoApis,
  config.addressEnrichmentUrl,
  undefined,
  config.daoRelayers,
);

getOpenApiSpec().catch((err) => {
  logger.warn({ err }, "failed to generate OpenAPI spec on startup");
});

app.get("/docs/json", async (c) => {
  return c.json(await getOpenApiSpec());
});
app.get("/docs", swaggerUI({ url: "/docs/json" }));

relayerProxy(app, config.daoRelayers, registry);

// Proxy catch-all (must be last)
proxy(app, config.daoApis, registry);

logger.info({ port: config.port }, "Gateful REST API running");

serve({ fetch: app.fetch, port: config.port, hostname: "::" });

export { app };
