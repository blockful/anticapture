import { trace } from "@opentelemetry/api";
import type { MiddlewareHandler } from "hono";

import { httpRequestDuration, httpRequestTotal } from "@/metrics";

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const duration = (performance.now() - start) / 1000;

  const http_request_method = c.req.method;
  const http_route = c.req.routePath ?? c.req.path;
  const http_response_status_code = String(c.res.status);

  const spanContext = trace.getActiveSpan()?.spanContext();
  const traceId = spanContext?.traceId;

  if (traceId) {
    c.res.headers.set("X-Trace-Id", traceId);
  }

  const labels = { http_request_method, http_route, http_response_status_code };
  httpRequestDuration.record(duration, labels);
  httpRequestTotal.add(1, labels);
};
