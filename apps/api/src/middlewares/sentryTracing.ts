import * as Sentry from "@sentry/node";
import type { MiddlewareHandler } from "hono";

export const sentryTracing: MiddlewareHandler = (c, next) => {
  return Sentry.withIsolationScope(() => {
    const sentryTrace = c.req.header("sentry-trace") ?? "";
    const baggage = c.req.header("baggage") ?? "";

    return Sentry.continueTrace({ sentryTrace, baggage }, () => {
      return Sentry.startSpan(
        { name: `${c.req.method} ${c.req.path}`, op: "http.server" },
        () => next(),
      );
    });
  });
};
