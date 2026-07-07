import type { Context, Next } from "hono";

import { logger } from "../logger.js";

/** Minimal Redis surface the middleware needs (matches node-redis). */
export interface RateLimitStore {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

/**
 * Fixed-window per-token rate limiting.
 *
 * Counts requests per (token, epoch minute) in Redis. Fails open: without
 * Redis (or on Redis errors) requests pass — availability over enforcement.
 * Runs after tokenAuthMiddleware; requests without auth context (public
 * paths, auth disabled) are not limited.
 *
 * A non-positive limit (0 is the sentinel) means "unbounded": the token is
 * exempt from rate limiting and never touches Redis.
 */
export function rateLimitMiddleware(store?: RateLimitStore) {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth");
    if (!auth || !store || auth.rateLimitPerMin <= 0) return next();

    const epochMinute = Math.floor(Date.now() / 60_000);
    const key = `rl:${auth.tokenId}:${epochMinute}`;

    let count: number;
    try {
      count = await store.incr(key);
      // First hit of the window sets the expiry; 2 minutes covers clock skew.
      if (count === 1) await store.expire(key, 120);
    } catch (err) {
      logger.warn({ err }, "rate limit store failed — failing open");
      return next();
    }

    if (count > auth.rateLimitPerMin) {
      const retryAfter = 60 - Math.floor((Date.now() / 1000) % 60);
      return c.json({ error: "Rate limit exceeded" }, 429, {
        "Retry-After": String(retryAfter),
      });
    }

    return next();
  };
}
