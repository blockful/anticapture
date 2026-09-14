import type { MaybeDegraded } from "@/lib/degraded-upstream";

/**
 * Interface to represent a treasury's data point
 */
export interface LiquidTreasuryDataPoint {
  date: number; // Unix timestamp in seconds (start of day)
  liquidTreasury: number;
}

/**
 * Interface for fetching historical token prices.
 *
 * `degraded` marks a stale copy served after a provider outage, so callers can
 * keep it out of downstream caches.
 */
export interface PriceProvider {
  getHistoricalPricesMap(
    days: number,
  ): Promise<MaybeDegraded<Map<number, number>>>;
}
