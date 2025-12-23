import { formatUnits } from "viem";
import { TreasuryProvider } from "./providers";
import { PriceProvider } from "./types";
import { TreasuryResponse } from "@/api/mappers/treasury";
import { TreasuryRepository } from "../../repositories/treasury/treasury.repository";
import { forwardFill, createDailyTimelineFromData } from "./forward-fill";
import {
  calculateCutoffTimestamp,
  truncateTimestampTimeMs,
  normalizeMapTimestamps,
} from "@/eventHandlers/shared";

/**
 * Treasury Service - Orchestrates treasury data retrieval and calculation.
 * Responsibility: Coordinate between provider, repository, and business logic.
 */
export class TreasuryService {
  constructor(
    private provider?: TreasuryProvider,
    private priceProvider?: PriceProvider,
    private repository: TreasuryRepository = new TreasuryRepository(),
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
      const timestampMs = truncateTimestampTimeMs(item.date * 1000);
      liquidMap.set(timestampMs, item.liquidTreasury);
    });

    // Create timeline from first data point to today
    const timeline = createDailyTimelineFromData(liquidMap);

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
  ): Promise<TreasuryResponse> {
    if (!this.priceProvider) {
      return { items: [], totalCount: 0 };
    }

    const cutoffTimestamp = calculateCutoffTimestamp(days);

    // Fetch token quantities from DB and prices from CoinGecko
    const [tokenQuantities, historicalPrices] = await Promise.all([
      this.repository.getTokenQuantities(cutoffTimestamp),
      this.priceProvider.getHistoricalPrices(days),
    ]);

    if (tokenQuantities.size === 0 && historicalPrices.size === 0) {
      return { items: [], totalCount: 0 };
    }

    // Normalize all timestamps to midnight UTC
    const normalizedQuantities = normalizeMapTimestamps(tokenQuantities);
    const normalizedPrices = normalizeMapTimestamps(historicalPrices);

    // Create timeline from first data point to today
    const timeline = createDailyTimelineFromData(
      normalizedQuantities,
      normalizedPrices,
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

    return { items, totalCount: items.length };
  }

  /**
   * Get total treasury (liquid + token)
   */
  async getTotalTreasury(
    days: number,
    order: "asc" | "desc",
    decimals: number,
  ): Promise<TreasuryResponse> {
    const [liquidResult, tokenResult] = await Promise.all([
      this.getLiquidTreasury(days, order),
      this.getTokenTreasury(days, order, decimals),
    ]);

    if (liquidResult.items.length === 0 && tokenResult.items.length === 0) {
      return { items: [], totalCount: 0 };
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

    return { items, totalCount: items.length };
  }
}
