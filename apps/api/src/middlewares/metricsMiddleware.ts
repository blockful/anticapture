import type { MiddlewareHandler } from "hono";

import { httpRequestDuration, httpRequestTotal } from "@/metrics";

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const duration = (performance.now() - start) / 1000;

  const method = c.req.method;
  const route = c.req.routePath ?? c.req.path;
  const status = String(c.res.status);

  httpRequestDuration.record(duration, { method, route, status });
  httpRequestTotal.add(1, { method, route, status });
};
