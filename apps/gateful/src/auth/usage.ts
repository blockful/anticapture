import type { Context, Next } from "hono";

import { tenantRequestTotal } from "../metrics.js";

/**
 * Normalizes a request path to a bounded-cardinality route label:
 * - DAO routes keep the resource segment with the DAO templated out:
 *   `/ens/proposals/0x123` → `/{dao}/proposals`
 * - Any non-DAO first segment buckets to `/unknown`. Mirrors the cache
 *   middleware: clients can send arbitrary paths (including ones that would
 *   later 404), so passing them through verbatim would let a single caller
 *   create unbounded route labels. Bucketing keeps the Prometheus label set
 *   (tenant × route) bounded.
 */
export function normalizeRoute(
  path: string,
  daoApis: Map<string, string>,
): string {
  const [, first, second] = path.split("/");
  if (!first) return "/";
  if (daoApis.has(first.toLowerCase())) {
    return second ? `/{dao}/${second}` : "/{dao}";
  }
  return "/unknown";
}

/**
 * Counts every authenticated request as a Prometheus counter, labelled by
 * tenant and normalized route. Never blocks the request; usage is observed via
 * the `/metrics` endpoint (scraped by Prometheus) rather than persisted.
 * Requests without an auth context (public paths, auth disabled) are skipped.
 */
export function usageMiddleware(daoApis: Map<string, string>) {
  return async (c: Context, next: Next) => {
    await next();
    const auth = c.get("auth");
    if (!auth) return;
    tenantRequestTotal.add(1, {
      tenant: auth.tenant,
      route: normalizeRoute(c.req.path, daoApis),
    });
  };
}
