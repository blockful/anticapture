import { formatUnits } from "viem";

import {
  calculateCutoffTimestamp,
  normalizeMapTimestamps,
  truncateTimestampToMidnight,
} from "@/lib/date-helpers";
import { forwardFill, createDailyTimeline } from "@/lib/time-series";
import {
  recordDegradedUpstream,
  type MaybeDegraded,
} from "@/lib/degraded-upstream";
import { UpstreamUnavailableError } from "@/lib/upstream-error";
import { TreasuryResponse } from "@/mappers/treasury";

import { TreasuryProvider } from "./providers";
import { PriceProvider } from "./types";

export interface ITreasuryRepository {
  getTokenQuantities(cutoffTimestamp: number): Promise<Map<number, bigint>>;
  getLastTokenQuantityBeforeDate(
    cutoffTimestamp: number,
  ): Promise<bigint | null>;
}

/**
 * Treasury Service - Orchestrates treasury data retrieval and calculation.
 * Responsibility: Coordinate between provider, repository, and business logic.
 */
export class TreasuryService {
  constructor(
    private repository: ITreasuryRepository,
    private provider?: TreasuryProvider,
    private priceProvider?: PriceProvider,
  ) {}

  /**
   * Get liquid treasury only (from external providers)
   */
  async getLiquidTreasury(
    days: number,
    order: "asc" | "desc",
  ): Promise<TreasuryResponse> {
    if (!this.provider) {
      return { items: [], totalCount: 0 };
    }

    const cutoffTimestamp = calculateCutoffTimestamp(days);
    const data = await this.provider.fetchTreasury(cutoffTimestamp);

    if (data.length === 0) {
      return { items: [], totalCount: 0 };
    }

    // Convert to map with normalized timestamps (midnight UTC)
    const liquidMap = new Map<number, number>();
    data.forEach((item) => {
      const timestamp = truncateTimestampToMidnight(item.date);
      liquidMap.set(timestamp, item.liquidTreasury);
    });

    // Create timeline from first data point to today
    const timeline = createDailyTimeline(Math.min(...liquidMap.keys()));

    // Forward-fill to remove gaps
    const filledValues = forwardFill(timeline, liquidMap);

    // Build response
    const items = timeline
      .map((timestamp) => ({
        date: timestamp,
        value: filledValues.get(timestamp) ?? 0,
      }))
      .sort((a, b) => (order === "desc" ? b.date - a.date : a.date - b.date));

    return { items, totalCount: items.length };
  }

  /**
   * Get DAO token treasury only (token quantity × price)
   */
  async getTokenTreasury(
    days: number,
    order: "asc" | "desc",
    decimals: number,
  ): Promise<MaybeDegraded<TreasuryResponse>> {
    if (!this.priceProvider) {
      return { data: { items: [], totalCount: 0 }, degraded: false };
    }

    const cutoffTimestamp = calculateCutoffTimestamp(days);

    // Fetch token quantities from DB and prices from CoinGecko
    const [tokenQuantities, prices] = await Promise.all([
      this.repository.getTokenQuantities(cutoffTimestamp),
      this.fetchPricesOrDegrade(days),
    ]);
    const { data: historicalPrices, degraded } = prices;

    if (tokenQuantities.size === 0 && historicalPrices.size === 0) {
      return { data: { items: [], totalCount: 0 }, degraded };
    }

    // Normalize all timestamps to midnight UTC
    const normalizedQuantities = normalizeMapTimestamps(tokenQuantities);
    const normalizedPrices = normalizeMapTimestamps(historicalPrices);

    // Create timeline from first data point to today
    const timeline = createDailyTimeline(
      Math.min(...[...normalizedQuantities.keys(), ...normalizedPrices.keys()]),
    );

    // Get last known quantity before cutoff to use as initial value for forward-fill
    const lastKnownQuantity =
      await this.repository.getLastTokenQuantityBeforeDate(cutoffTimestamp);

    // Forward-fill both quantities and prices
    const filledQuantities = forwardFill(
      timeline,
      normalizedQuantities,
      lastKnownQuantity ?? undefined,
    );
    const filledPrices = forwardFill(timeline, normalizedPrices);

    // Calculate token treasury values
    const items = timeline
      .map((timestamp) => {
        const quantity = filledQuantities.get(timestamp) ?? 0n;
        const price = filledPrices.get(timestamp) ?? 0;
        const tokenAmount = Number(formatUnits(quantity, decimals));

        return { date: timestamp, value: price * tokenAmount };
      })
      .sort((a, b) => (order === "desc" ? b.date - a.date : a.date - b.date));

    return { data: { items, totalCount: items.length }, degraded };
  }

  /**
   * Prices for the token treasury. A CoinGecko outage degrades to no prices,
   * which yields zero-valued points, rather than a 5xx: the gateway counts
   * 5xx against the whole DAO's circuit breaker.
   */
  private async fetchPricesOrDegrade(
    days: number,
  ): Promise<MaybeDegraded<Map<number, number>>> {
    if (!this.priceProvider) {
      return { data: new Map(), degraded: false };
    }
    try {
      return await this.priceProvider.getHistoricalPricesMap(days);
    } catch (error) {
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: "treasury",
        mode: "empty",
        error,
        context: { days },
      });
      return { data: new Map(), degraded: true };
    }
  }

  /**
   * Get total treasury (liquid + token)
   */
  async getTotalTreasury(
    days: number,
    order: "asc" | "desc",
    decimals: number,
  ): Promise<MaybeDegraded<TreasuryResponse>> {
    const [liquidResult, token] = await Promise.all([
      this.getLiquidTreasury(days, order),
      this.getTokenTreasury(days, order, decimals),
    ]);
    const { data: tokenResult, degraded } = token;

    if (liquidResult.items.length === 0 && tokenResult.items.length === 0) {
      return { data: { items: [], totalCount: 0 }, degraded };
    }

    // Use the timeline with more data points (liquid or token could be empty)
    const baseItems =
      liquidResult.items.length > 0 ? liquidResult.items : tokenResult.items;

    const items = baseItems.map((item, i) => ({
      date: item.date,
      value:
        (liquidResult.items[i]?.value ?? 0) +
        (tokenResult.items[i]?.value ?? 0),
    }));

    return { data: { items, totalCount: items.length }, degraded };
  }
}
