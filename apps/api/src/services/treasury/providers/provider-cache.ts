import { LiquidTreasuryDataPoint } from "../types";

const CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours

/**
 * Past this, serving the last known treasury is worse than serving none.
 *
 * It must stay larger than the fresh TTL: a value is only ever served stale
 * once it has expired, so a cap equal to the TTL would make stale unreachable.
 * One extra day is the window an outage may be ridden out for. Same rule as
 * `REVENUE_STALE_MAX_AGE_MS` in the revenue cache.
 */
const STALE_MAX_AGE_MS = CACHE_TTL_MS + 60 * 60 * 1000 * 24;

type CacheEntry = {
  fetchedAt: number;
  data: LiquidTreasuryDataPoint[];
};

export class TreasuryProviderCache {
  private entry: CacheEntry | undefined;

  get(): LiquidTreasuryDataPoint[] | null {
    if (!this.entry) return null;
    if (Date.now() - this.entry.fetchedAt > CACHE_TTL_MS) return null;
    return this.entry.data;
  }

  /**
   * Last known value for serving stale data when the provider fails, as long
   * as it was fetched within the max age. Never written on a failure, so a
   * degraded response can never become the next response's source of truth.
   */
  getStale(): LiquidTreasuryDataPoint[] | null {
    if (!this.entry) return null;
    if (Date.now() - this.entry.fetchedAt > STALE_MAX_AGE_MS) return null;
    return this.entry.data;
  }

  set(data: LiquidTreasuryDataPoint[]): void {
    this.entry = { fetchedAt: Date.now(), data };
  }

  clear(): void {
    this.entry = undefined;
  }
}
