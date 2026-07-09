import { collectPrometheusMetrics } from "@anticapture/observability";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

import { forwardedHost, type AuthResolver } from "@/auth";
import { draftsController } from "@/controllers/drafts";
import type { UserApiDrizzle } from "@/database/types";
import { exporter } from "@/instrumentation";
import { logger } from "@/logger";
import { metricsMiddleware } from "@/middlewares/metrics";
import { requestLogger } from "@/middlewares/logger";
import type { DraftsService } from "@/services/drafts";

export type AppConfig = {
  db: UserApiDrizzle;
  authResolver: AuthResolver;
  draftsService: DraftsService;
};

export function createApp({
  db,
  authResolver,
  draftsService,
}: AppConfig): Hono {
  const app = new Hono();

  app.use("*", requestLogger());
  app.use("*", metricsMiddleware());

  // Railway healthcheck: probe the DB so a bad DATABASE_URL / down Postgres
  // marks the service unhealthy instead of serving auth traffic that 500s.
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

  // Better-auth owns all of /api/auth/* (SIWE nonce/verify, session, sign-out,
  // and later Google/magic-link). The instance is resolved per request Host so
  // whitelabel domains verify SIWE against their own host; an unlisted host is
  // rejected before any session can be issued.
  app.on(["POST", "GET"], "/api/auth/*", (c) => {
    const auth = authResolver.resolve(forwardedHost(c.req.raw.headers));
    if (!auth) return c.json({ error: "untrusted_host" }, 400);
    return auth.handler(c.req.raw);
  });

  draftsController(app, draftsService, authResolver);

  return app;
}
