import type { MiddlewareHandler } from "hono";

import { httpRequestDuration, httpRequestTotal } from "@/metrics";

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const duration = (performance.now() - start) / 1000;

  const method = c.req.method;
  const route = c.req.routePath ?? c.req.path;
  const status = String(c.res.status);

  httpRequestDuration.observe({ method, route, status }, duration);
  httpRequestTotal.inc({ method, route, status });
};
