import type { MiddlewareHandler } from "hono";
import { routePath } from "hono/route";

import { httpRequestDuration } from "../metrics.js";

const SKIP_PATHS = new Set(["/metrics", "/health"]);

function resolveClientSource(header: string | undefined): string {
  if (header === "notification-system") return "notification-system";
  if (header === "anticapture-frontend") return "anticapture-frontend";
  if (header === "anticapture-mcp") return "anticapture-mcp";
  return "other";
}

export const metricsMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    if (SKIP_PATHS.has(c.req.path)) return next();

    const start = performance.now();
    let status = 500;
    try {
      await next();
      status = c.res.status;
    } catch (err) {
      status = c.res?.status ?? 500;
      throw err;
    } finally {
      const duration = (performance.now() - start) / 1000;
      httpRequestDuration.record(duration, {
        http_request_method: c.req.method,
        http_route: routePath(c) ?? c.req.path,
        http_response_status_code: status,
        client_source: resolveClientSource(c.req.header("x-client-source")),
      });
    }
  };
};
