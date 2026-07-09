import { collectPrometheusMetrics } from "@anticapture/observability";
import { Hono } from "hono";
import { sql } from "drizzle-orm";

import { resolveAuth } from "@/auth";
import type { UserApiDrizzle } from "@/database";
import { exporter } from "@/instrumentation";
import { logger } from "@/logger";
import { metricsMiddleware } from "@/middlewares/metrics";
import { requestLogger } from "@/middlewares/logger";

export type AppConfig = {
  db: UserApiDrizzle;
};

export function createApp({ db }: AppConfig): Hono {
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

  // Better-auth owns all of /api/auth/* (nonce, SIWE verify, session, sign-out,
  // and later Google/magic-link). The instance is resolved per request Host so
  // whitelabel domains verify SIWE against their own host; an unlisted host is
  // rejected before any session can be issued.
  app.on(["POST", "GET"], "/api/auth/*", (c) => {
    const auth = resolveAuth(c.req.header("host"));
    if (!auth) return c.json({ error: "untrusted_host" }, 400);
    return auth.handler(c.req.raw);
  });

  return app;
}
