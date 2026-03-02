import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import * as Sentry from "@sentry/node";

export function sentry(app: Hono) {
  app.get("/debug-sentry", () => {
    // Send a log before throwing the error
    Sentry.logger.info("User triggered test error", {
      action: "test_error_endpoint",
    });
    throw new Error("My first Sentry error!");
  });
}
