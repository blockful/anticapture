import { collectPrometheusMetrics } from "@anticapture/observability";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";

import { tokensController } from "@/controllers/tokens";
import { validateController } from "@/controllers/validate";
import { exporter } from "@/instrumentation";
import { metricsMiddleware } from "@/middlewares/metrics";
import { requestLogger } from "@/middlewares/logger";
import type { TokensService } from "@/services/tokens";

export type AppConfig = {
  service: TokensService;
  adminApiKey: string;
  internalApiKey: string;
};

export function createApp({
  service,
  adminApiKey,
  internalApiKey,
}: AppConfig): Hono {
  const app = new Hono();

  app.use("*", requestLogger());
  app.use("*", metricsMiddleware());

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.get("/metrics", async (c) => {
    const { body, contentType } = await collectPrometheusMetrics(exporter);
    return c.body(body, 200, { "Content-Type": contentType });
  });

  // Admin surface: humans minting/listing/revoking tokens.
  app.use("/tokens", bearerAuth({ token: adminApiKey }));
  app.use("/tokens/*", bearerAuth({ token: adminApiKey }));

  // Internal surface: Gateful validating tokens.
  app.use("/validate", bearerAuth({ token: internalApiKey }));

  tokensController(app, service);
  validateController(app, service);

  return app;
}
