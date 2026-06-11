import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";

import { tokensController } from "@/controllers/tokens";
import { usageController } from "@/controllers/usage";
import { validateController } from "@/controllers/validate";
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

  app.get("/health", (c) => c.json({ status: "ok" }));

  // Admin surface: humans minting/listing/revoking tokens.
  app.use("/tokens", bearerAuth({ token: adminApiKey }));
  app.use("/tokens/*", bearerAuth({ token: adminApiKey }));

  // Internal surface: Gateful validating tokens and reporting usage.
  app.use("/validate", bearerAuth({ token: internalApiKey }));
  app.use("/usage/*", bearerAuth({ token: internalApiKey }));

  tokensController(app, service);
  validateController(app, service);
  usageController(app, service);

  return app;
}
