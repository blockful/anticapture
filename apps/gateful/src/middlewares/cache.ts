import type { Context, Next } from "hono";

import { cacheRequestTotal } from "../metrics.js";

/** Minimal interface the middleware actually needs */
export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<unknown>;
}

type CachedEntry = {
  body: string;
  status: number;
  contentType: string;
  cacheControl: string;
};

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Cache-aside middleware using Redis.
 *
 * - Skips non-GET requests.
 * - On cache hit: returns the stored response with `Cache-Status: Redis; hit`.
 * - On cache miss: passes through, then stores the response when:
 *     - The status is 2xx.
 *     - The upstream set a `Cache-Control: max-age=<n>` header with n > 0.
 * - All Redis errors are swallowed (fail open) to preserve availability.
 */
export function cacheMiddleware(redis: CacheStore) {
  return async (c: Context, next: Next) => {
    // Only cache GET requests.
    if (c.req.method !== "GET") return next();

    const key = c.req.url;

    // --- Request phase: check for a cached response ---
    // Fail open: if Redis is unavailable, .catch returns null and we proceed normally.
    const raw = await redis.get(key).catch(() => null);
    if (raw) {
      const entry = safeParse<CachedEntry>(raw);
      if (!entry) {
        cacheRequestTotal.add(1, { result: "corrupt", route: c.req.path });
        return next();
      }
      cacheRequestTotal.add(1, { result: "hit", route: c.req.path });
      return new Response(entry.body, {
        status: entry.status,
        headers: {
          "Content-Type": entry.contentType,
          "Cache-Control": entry.cacheControl,
          "Cache-Status": "Redis; hit",
        },
      });
    }

    cacheRequestTotal.add(1, { result: "miss", route: c.req.path });
    await next();

    // --- Response phase: store the response if eligible ---
    if (c.res.status < 200 || c.res.status >= 300) return;

    const cacheControl = c.res.headers.get("Cache-Control");
    if (!cacheControl) return;

    const match = /max-age=(\d+)/.exec(cacheControl);
    // No max-age directive or explicitly zero → do not cache.
    if (!match || match[1] === "0") return;

    const ttl = parseInt(match[1], 10);
    if (ttl <= 0) return;

    // Fail open: response is still returned even if we fail to cache it.
    await c.res
      .clone()
      .text()
      .then((body) => {
        const contentType =
          c.res.headers.get("Content-Type") ?? "application/json";
        const entry: CachedEntry = {
          body,
          status: c.res.status,
          contentType,
          cacheControl: cacheControl!,
        };
        return redis.set(key, JSON.stringify(entry), { EX: ttl });
      })
      .catch(() => null);
  };
}
