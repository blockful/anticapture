import { collectPrometheusMetrics } from "@anticapture/observability";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import { bearerAuth } from "hono/bearer-auth";

import type { AuthfulDrizzle } from "@/database";
import { tokensController } from "@/controllers/tokens";
import { validateController } from "@/controllers/validate";
import { exporter } from "@/instrumentation";
import { metricsMiddleware } from "@/middlewares/metrics";
import { requestLogger } from "@/middlewares/logger";
import { scopedTokenAuth } from "@/middlewares/token-auth";
import { logger } from "@/logger";
import type { TokensService } from "@/services/tokens";

export type AppConfig = {
  service: TokensService;
  db: AuthfulDrizzle;
  adminApiKey: string;
  internalApiKey: string;
  provisioningApiKey?: string;
  usageApiKey?: string;
};

export function createApp({
  service,
  db,
  adminApiKey,
  internalApiKey,
  provisioningApiKey,
  usageApiKey,
}: AppConfig): Hono {
  const app = new Hono();

  app.use("*", requestLogger());
  app.use("*", metricsMiddleware());

  // Railway healthcheck: probe the DB so a bad DATABASE_URL / down Postgres
  // marks the service unhealthy instead of serving traffic that 500s on the
  // first repository call (which also breaks Gateful auth for uncached tokens).
  app.get("/health", async (c) => {
    try {
      await db.execute(sql`select 1`);
      return c.json({ status: "ok" });
    } catch (err) {
      logger.error({ err }, "Health check DB probe failed");
      return c.json({ status: "error" }, 503);
    }
  });

  app.get("/metrics", async (c) => {
    const { body, contentType } = await collectPrometheusMetrics(exporter);
    return c.body(body, 200, { "Content-Type": contentType });
  });

  // Token-management surface: the admin key (unrestricted), the optional
  // provisioning key (scoped to `user:*`, enforced in the controller), or the
  // optional usage key (POST /tokens/usage only, enforced in the middleware).
  const tokenAuth = scopedTokenAuth({
    adminApiKey,
    provisioningApiKey,
    usageApiKey,
  });
  app.use("/tokens", tokenAuth);
  app.use("/tokens/*", tokenAuth);

  // Internal surface: Gateful validating tokens.
  app.use("/validate", bearerAuth({ token: internalApiKey }));

  tokensController(app, service);
  validateController(app, service);

  return app;
}
