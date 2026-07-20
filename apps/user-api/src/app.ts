import { collectPrometheusMetrics } from "@anticapture/observability";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import { bodyLimit } from "hono/body-limit";

import { forwardedHost, type AuthResolver } from "@/auth";
import { apiKeysController } from "@/controllers/api-keys";
import { draftsController } from "@/controllers/drafts";
import type { UserApiDrizzle } from "@/database/types";
import { exporter } from "@/instrumentation";
import { logger } from "@/logger";
import { metricsMiddleware } from "@/middlewares/metrics";
import { requestLogger } from "@/middlewares/logger";
import type { ApiKeysService } from "@/services/api-keys";
import type { ProposalDraftsService } from "@/services/drafts";

export type AppConfig = {
  db: UserApiDrizzle;
  authResolver: AuthResolver;
  draftsService: ProposalDraftsService;
  // Present only when Authful provisioning is configured — the API-key surface
  // stays absent otherwise (env-gated, like Google / magic link).
  apiKeysService?: ApiKeysService;
};

export function createApp({
  db,
  authResolver,
  draftsService,
  apiKeysService,
}: AppConfig): Hono {
  const app = new Hono();

  app.use("*", requestLogger());
  app.use("*", metricsMiddleware());
  // Global backstop against oversized payloads (the drafts schemas also
  // bound each field): self-service accounts must not consume request
  // memory at will. 1 MiB comfortably fits the largest legitimate draft.
  app.use("*", bodyLimit({ maxSize: 1024 * 1024 }));

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

  // Public capability discovery: which sign-in methods this deployment
  // serves. The frontend gates its Email/Google buttons on this instead of
  // its own env, so a method the server can't handle is never offered.
  app.get("/auth/methods", (c) => c.json(authResolver.methods));

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
  if (apiKeysService) {
    apiKeysController(app, apiKeysService, authResolver);
  }

  return app;
}
