import { LiquidTreasuryDataPoint } from "../types";

type CacheSchema = {
  timestamp: number;
  data: LiquidTreasuryDataPoint[];
};

export class TreasuryProviderCache {
  private readonly CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours
  private readonly cache = new Map<
    keyof CacheSchema,
    CacheSchema[keyof CacheSchema]
  >();

  get(): LiquidTreasuryDataPoint[] | null {
    const timestamp = this.getCache("timestamp");

    if (!timestamp) {
      return null;
    }

    const isExpired = Date.now() - timestamp > this.CACHE_TTL_MS;
    if (isExpired) {
      this.clear();
      return null;
    }

    return this.getCache("data");
  }

  set(data: LiquidTreasuryDataPoint[]): void {
    this.setCache("timestamp", Date.now());
    this.setCache("data", data);
  }

  clear(): void {
    this.cache.clear();
  }

  private setCache<K extends keyof CacheSchema>(key: K, value: CacheSchema[K]) {
    this.cache.set(key, value);
  }

  private getCache<K extends keyof CacheSchema>(key: K): CacheSchema[K] | null {
    return this.cache.get(key) as CacheSchema[K] | null;
  }
}
