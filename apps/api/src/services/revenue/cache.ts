type CacheEntry<T> = {
  timestamp: number;
  ttlMs: number;
  data: T;
};

export const REVENUE_CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours

/**
 * Short lease put on a stale entry after an upstream failure. It stops every
 * request during an outage from opening its own upstream call while still
 * letting the data refresh soon after the provider recovers.
 */
export const REVENUE_STALE_TTL_MS = 60 * 1000;

export class RevenueCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      return null;
    }

    return entry.data;
  }

  /** Last known value regardless of TTL, for serving stale data when the upstream fails. */
  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    return entry ? entry.data : null;
  }

  set<T>(key: string, data: T, ttlMs: number = REVENUE_CACHE_TTL_MS): void {
    this.cache.set(key, { timestamp: Date.now(), ttlMs, data });
  }

  clear(): void {
    this.cache.clear();
  }
}
