import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { logger } from "../logger.js";
import { CircuitOpenError } from "../shared/circuit-breaker.js";

export const getErrorStatus = (err: unknown): number => {
  if (err instanceof CircuitOpenError) return 503;
  if (err instanceof HTTPException) return err.status;
  return 500;
};

export const requestLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    if (c.req.path === "/metrics" || c.req.path === "/health") return next();
    const start = performance.now();

    try {
      await next();
    } catch (err) {
      const status = getErrorStatus(err);
      logger.error(
        {
          err,
          method: c.req.method,
          path: c.req.path,
          status,
          durationMs: Math.round(performance.now() - start),
        },
        `${c.req.method} ${c.req.path} ${status}`,
      );
      throw err;
    }

    logger.info(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Math.round(performance.now() - start),
      },
      `${c.req.method} ${c.req.path} ${c.res.status}`,
    );
  };
};
