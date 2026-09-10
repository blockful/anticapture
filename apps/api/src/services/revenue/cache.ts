type CacheEntry<T> = {
  timestamp: number;
  data: T;
};

export class RevenueCache {
  private readonly CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > this.CACHE_TTL_MS;
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

  set<T>(key: string, data: T): void {
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  clear(): void {
    this.cache.clear();
  }
}
