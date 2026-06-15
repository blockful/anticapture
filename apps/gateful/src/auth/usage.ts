import type { Context, Next } from "hono";

import { logger } from "../logger.js";
import {
  AuthfulResponseError,
  type AuthfulClient,
  type UsageBatchEntry,
} from "./authful-client.js";

const FLUSH_INTERVAL_MS = 30_000;

/**
 * Normalizes a request path to a bounded-cardinality route label:
 * - DAO routes keep the resource segment with the DAO templated out:
 *   `/ens/proposals/0x123` → `/{dao}/proposals`
 * - Any non-DAO first segment buckets to `/unknown`. Mirrors the cache
 *   middleware: clients can send arbitrary paths (including ones that would
 *   later 404), so passing them through verbatim would let a single caller
 *   create unbounded route labels — and a poison label could wedge the whole
 *   usage flush. Bucketing keeps cardinality (and the batch) bounded.
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
 * In-memory usage accumulator flushed to Authful in batches.
 *
 * Best-effort by design: recording never blocks a request, and a failed
 * flush re-buffers the counts for the next interval. Counts survive a
 * Authful outage but not a Gateful restart — acceptable for usage insight.
 */
export class UsageTracker {
  // Keyed by a structured (token, route, hour) tuple, never a delimiter-joined
  // string: routes can contain any character, so a `|`-joined key would not
  // round-trip safely back into batch entries on flush.
  private counts = new Map<string, UsageBatchEntry>();
  private timer?: NodeJS.Timeout;

  constructor(private readonly client: AuthfulClient) {}

  record(tokenId: string, route: string): void {
    const hour = new Date();
    hour.setUTCMinutes(0, 0, 0);
    const hourIso = hour.toISOString();
    const key = JSON.stringify([tokenId, route, hourIso]);
    const existing = this.counts.get(key);
    if (existing) existing.count += 1;
    else this.counts.set(key, { tokenId, route, hour: hourIso, count: 1 });
  }

  start(): void {
    this.timer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
    // Never keep the process alive just to flush usage.
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async flush(): Promise<void> {
    if (this.counts.size === 0) return;
    const snapshot = this.counts;
    this.counts = new Map();

    const entries = [...snapshot.values()];

    try {
      await this.client.recordUsageBatch(entries);
    } catch (err) {
      // A 4xx means Authful rejected the batch itself (e.g. a malformed
      // entry) — retrying the same payload would fail forever and the buffer
      // would grow unbounded, silently killing all usage tracking. Drop it.
      // Only transient failures (network errors, 5xx) are worth re-buffering.
      if (err instanceof AuthfulResponseError && err.status < 500) {
        logger.error(
          { err, status: err.status, entries: entries.length },
          "usage batch rejected by Authful — dropping to avoid a poison loop",
        );
        return;
      }

      // Re-buffer so counts are retried on the next interval, merging with any
      // entries recorded since the snapshot was taken.
      for (const [key, entry] of snapshot) {
        const existing = this.counts.get(key);
        if (existing) existing.count += entry.count;
        else this.counts.set(key, entry);
      }
      logger.warn(
        { err, entries: entries.length },
        "usage flush failed — re-buffered",
      );
    }
  }
}

/** Counts every authenticated request against its token. Never blocks. */
export function usageMiddleware(
  tracker: UsageTracker,
  daoApis: Map<string, string>,
) {
  return async (c: Context, next: Next) => {
    await next();
    const auth = c.get("auth");
    if (!auth) return;
    tracker.record(auth.tokenId, normalizeRoute(c.req.path, daoApis));
  };
}
