import type { Context, Next } from "hono";

import { logger } from "../logger.js";
import type { TokenfulClient, UsageBatchEntry } from "./tokenful-client.js";

const FLUSH_INTERVAL_MS = 30_000;

/**
 * Normalizes a request path to a bounded-cardinality route label:
 * - DAO routes keep the resource segment with the DAO templated out:
 *   `/ens/proposals/0x123` → `/{dao}/proposals`
 * - Aggregator routes keep only the first segment: `/address/0xabc` → `/address`
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
  return `/${first}`;
}

/**
 * In-memory usage accumulator flushed to Tokenful in batches.
 *
 * Best-effort by design: recording never blocks a request, and a failed
 * flush re-buffers the counts for the next interval. Counts survive a
 * Tokenful outage but not a Gateful restart — acceptable for usage insight.
 */
export class UsageTracker {
  private counts = new Map<string, number>();
  private timer?: NodeJS.Timeout;

  constructor(private readonly client: TokenfulClient) {}

  record(tokenId: string, route: string): void {
    const hour = new Date();
    hour.setUTCMinutes(0, 0, 0);
    const key = `${tokenId}|${route}|${hour.toISOString()}`;
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
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

    const entries: UsageBatchEntry[] = [...snapshot.entries()].map(
      ([key, count]) => {
        const [tokenId, route, hour] = key.split("|") as [
          string,
          string,
          string,
        ];
        return { tokenId, route, hour, count };
      },
    );

    try {
      await this.client.recordUsageBatch(entries);
    } catch (err) {
      // Re-buffer so counts are retried on the next interval.
      for (const [key, count] of snapshot) {
        this.counts.set(key, (this.counts.get(key) ?? 0) + count);
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
