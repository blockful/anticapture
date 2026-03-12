import { trace } from "@opentelemetry/api";
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_HTTP_ROUTE,
} from "@opentelemetry/semantic-conventions";
import type { MiddlewareHandler } from "hono";
import { routePath } from "hono/route";

import { httpRequestDuration, httpRequestTotal } from "@/metrics";

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  try {
    await next();
  } finally {
    const duration = (performance.now() - start) / 1000;

    const spanContext = trace.getActiveSpan()?.spanContext();
    const traceId = spanContext?.traceId;

    if (traceId) {
      c.res.headers.set("X-Trace-Id", traceId);
    }

    const labels = {
      [ATTR_HTTP_REQUEST_METHOD]: c.req.method,
      [ATTR_HTTP_ROUTE]: routePath(c) ?? c.req.path,
      [ATTR_HTTP_RESPONSE_STATUS_CODE]: c.res?.status ?? 500,
    };
    httpRequestDuration.record(duration, labels);
    httpRequestTotal.add(1, labels);
  }
};
