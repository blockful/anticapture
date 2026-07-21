import { randomUUID } from "node:crypto";

import type { Context, Next } from "hono";

import { logger } from "../logger.js";
import { tenantRequestTotal } from "../metrics.js";
import type { TokenUsageBatch, TokenUsageIncrement } from "./authful-client.js";
import type { AuthContext } from "./token-auth.js";

const USER_TENANT_PREFIX = "user:";
const DEFAULT_FLUSH_INTERVAL_MS = 60_000;
const DEFAULT_MAX_BUCKETS = 10_000;

export interface TokenUsageWriter {
  recordUsage(batch: TokenUsageBatch): Promise<void>;
  isRetryableUsageError?(error: unknown): boolean;
}

type UsageBucket = TokenUsageIncrement;

export class UsageAccumulator {
  private buckets = new Map<string, UsageBucket>();
  private retryBatches: TokenUsageBatch[] = [];
  private flushPromise: Promise<void> | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly writer: TokenUsageWriter,
    private readonly options: {
      flushIntervalMs?: number;
      maxBuckets?: number;
      now?: () => Date;
      createIdempotencyKey?: () => string;
    } = {},
  ) {}

  record(auth: AuthContext): void {
    if (!auth.tenant.startsWith(USER_TENANT_PREFIX)) return;

    const day = this.currentDay();
    const key = `${auth.tokenId}:${day}`;
    const existing = this.buckets.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    if (this.buckets.size >= this.maxBuckets) {
      void this.flush();
    }
    this.buckets.set(key, { tokenId: auth.tokenId, day, count: 1 });
    if (this.buckets.size === this.maxBuckets + 1) {
      logger.warn(
        { maxBuckets: this.maxBuckets },
        "token usage buffer exceeded flush threshold while a flush is in flight",
      );
    }
  }

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      void this.flush();
    }, this.options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS);
    this.interval.unref();
  }

  async stop(): Promise<void> {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    // Bound shutdown retries so an unavailable Authful cannot block process
    // termination forever. Three passes cover an in-flight batch, one retry,
    // and requests that arrived while the HTTP server was draining.
    for (let attempt = 0; attempt < 3 && this.hasPending; attempt++) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushPromise) return this.flushPromise;
    const batch = this.nextBatch();
    if (!batch) return;

    this.flushPromise = this.writer
      .recordUsage(batch)
      .catch((err: unknown) => {
        if (this.writer.isRetryableUsageError?.(err) ?? true) {
          this.retryBatches.unshift(batch);
          logger.warn(
            { err },
            "failed to flush token usage to Authful; retrying",
          );
          return;
        }
        logger.warn(
          { err, idempotencyKey: batch.idempotencyKey },
          "discarding token usage batch after permanent Authful rejection",
        );
      })
      .finally(() => {
        this.flushPromise = undefined;
      });
    return this.flushPromise;
  }

  private nextBatch(): TokenUsageBatch | undefined {
    const retry = this.retryBatches.shift();
    if (retry) return retry;
    if (this.buckets.size === 0) return undefined;

    const pending = this.buckets;
    this.buckets = new Map();
    return {
      idempotencyKey: this.options.createIdempotencyKey?.() ?? randomUUID(),
      items: [...pending.values()],
    };
  }

  private currentDay(): string {
    return (this.options.now?.() ?? new Date()).toISOString().slice(0, 10);
  }

  private get maxBuckets(): number {
    return this.options.maxBuckets ?? DEFAULT_MAX_BUCKETS;
  }

  private get hasPending(): boolean {
    return (
      this.flushPromise !== undefined ||
      this.retryBatches.length > 0 ||
      this.buckets.size > 0
    );
  }
}

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
 * Counts every authenticated request as a Prometheus counter and, for user
 * keys, in the bounded persistence accumulator. Never blocks the request.
 * Requests without an auth context (public paths, auth disabled) are skipped.
 */
export function usageMiddleware(
  daoApis: Map<string, string>,
  usageAccumulator?: UsageAccumulator,
) {
  return async (c: Context, next: Next) => {
    // Record in a finally so failed requests (downstream 5xx surfaced as a
    // thrown error, or a later middleware returning 429) are still counted.
    try {
      await next();
    } finally {
      const auth = c.get("auth");
      if (auth) {
        usageAccumulator?.record(auth);
        tenantRequestTotal.add(1, {
          // Self-service keys mint one `user:<id>` tenant per user —
          // unbounded. Bucket them so the Prometheus label set stays
          // bounded; ops tenants keep their verbatim label.
          tenant: auth.tenant.startsWith(USER_TENANT_PREFIX)
            ? `${USER_TENANT_PREFIX}*`
            : auth.tenant,
          name: auth.name,
          route: normalizeRoute(c.req.path, daoApis),
        });
      }
    }
  };
}
