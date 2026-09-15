type CacheEntry<T> = {
  /** When the value came back from the upstream, never re-stamped by a lease. */
  fetchedAt: number;
  /** When this entry stops counting as fresh, moved forward by a stale lease. */
  freshUntil: number;
  data: T;
};

export const REVENUE_CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours

/**
 * Short lease put on a stale entry after an upstream failure. It stops every
 * request during an outage from opening its own upstream call while still
 * letting the data refresh soon after the provider recovers.
 */
export const REVENUE_STALE_TTL_MS = 60 * 1000;

/**
 * Past this, serving the last known revenue is worse than serving none.
 *
 * It must stay larger than the fresh TTL: a result is only ever served stale
 * once it has expired, so a cap equal to the TTL would make stale unreachable.
 * One extra day is the window an outage may be ridden out for.
 */
export const REVENUE_STALE_MAX_AGE_MS =
  REVENUE_CACHE_TTL_MS + 60 * 60 * 1000 * 24;

export class RevenueCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.freshUntil) {
      return null;
    }

    return entry.data;
  }

  /**
   * Last known value for serving stale data when the upstream fails, as long
   * as it was actually fetched within the max age. A lease extends freshness,
   * never `fetchedAt`, so a multi-day outage cannot serve unboundedly old data.
   */
  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > REVENUE_STALE_MAX_AGE_MS) return null;
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number = REVENUE_CACHE_TTL_MS): void {
    const now = Date.now();
    const previous = this.cache.get(key);
    this.cache.set(key, {
      // A lease re-uses the original fetch time so the max age still applies.
      fetchedAt:
        ttlMs === REVENUE_CACHE_TTL_MS ? now : (previous?.fetchedAt ?? now),
      freshUntil: now + ttlMs,
      data,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
