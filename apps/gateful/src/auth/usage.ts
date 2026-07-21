import type { Context, Next } from "hono";

import { tenantRequestTotal } from "../metrics.js";

/**
 * Normalizes a request path to a bounded-cardinality route label:
 * - DAO routes collapse every sub-resource to `/{dao}/*`:
 *   `/ens/proposals/0x123` → `/{dao}/*`. The resource segment is
 *   caller-controlled (any path is accepted at the gateway and only 404s at
 *   the DAO backend), so keeping it verbatim would let a single caller create
 *   unbounded route labels. Mirrors the cache middleware's `/{dao}/*` label.
 * - Any non-DAO first segment buckets to `/unknown`.
 * Bucketing keeps the Prometheus label set (tenant × route) bounded.
 */
export function normalizeRoute(
  path: string,
  daoApis: Map<string, string>,
): string {
  const [, first] = path.split("/");
  if (!first) return "/";
  if (daoApis.has(first.toLowerCase())) {
    return "/{dao}/*";
  }
  return "/unknown";
}

/**
 * Counts every authenticated request as a Prometheus counter, labelled by
 * tenant, token name, and normalized route. Never blocks the request; usage is
 * observed via the `/metrics` endpoint (scraped by Prometheus) rather than persisted.
 * Requests without an auth context (public paths, auth disabled) are skipped.
 */
export function usageMiddleware(daoApis: Map<string, string>) {
  return async (c: Context, next: Next) => {
    // Record in a finally so failed requests (downstream 5xx surfaced as a
    // thrown error, or a later middleware returning 429) are still counted.
    try {
      await next();
    } finally {
      const auth = c.get("auth");
      if (auth) {
        tenantRequestTotal.add(1, {
          // Self-service keys mint one `user:<id>` tenant per user —
          // unbounded. Bucket them so the Prometheus label set stays
          // bounded; ops tenants keep their verbatim label.
          tenant: auth.tenant.startsWith("user:") ? "user:*" : auth.tenant,
          name: auth.name,
          route: normalizeRoute(c.req.path, daoApis),
        });
      }
    }
  };
}
