import { LiquidTreasuryDataPoint } from "../types";

type CacheSchema = {
  timestamp: number;
  data: LiquidTreasuryDataPoint[];
};

export class TreasuryProviderCache {
  // private readonly CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 min
  private readonly cache = new Map<
    keyof CacheSchema,
    CacheSchema[keyof CacheSchema]
  >();

  get(): LiquidTreasuryDataPoint[] | null {
    console.log("Checking for cached data...");
    const timestamp = this.getCache("timestamp");

    if (!timestamp) {
      console.log("No cache");
      return null;
    }

    const isExpired = Date.now() - timestamp > this.CACHE_TTL_MS;
    if (isExpired) {
      console.log("Cache expired");
      this.clear();
      return null;
    }

    console.log("Returning cached data...");
    return this.getCache("data");
  }

  set(data: LiquidTreasuryDataPoint[]): void {
    console.log(
      `Setting cache for timestamp ${Date.now()}; TTL: ${this.CACHE_TTL_MS}`,
    );
    this.setCache("timestamp", Date.now());
    this.setCache("data", data);
  }

  clear(): void {
    console.log("Clearing out cache");
    this.cache.clear();
  }

  private setCache<K extends keyof CacheSchema>(key: K, value: CacheSchema[K]) {
    this.cache.set(key, value);
  }

  private getCache<K extends keyof CacheSchema>(key: K): CacheSchema[K] | null {
    return this.cache.get(key) as CacheSchema[K] | null;
  }
}
