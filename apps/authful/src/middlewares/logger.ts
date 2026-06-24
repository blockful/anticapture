import type { MiddlewareHandler } from "hono";

import { logger } from "../logger.js";

export const requestLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = performance.now();

    try {
      await next();
    } catch (err) {
      logger.error(
        {
          err,
          method: c.req.method,
          path: c.req.path,
          durationMs: Math.round(performance.now() - start),
        },
        "request failed",
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
      "request completed",
    );
  };
};
