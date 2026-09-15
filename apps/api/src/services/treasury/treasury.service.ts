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
import { filterWithFallback } from "@/lib/query-helpers";
import { UpstreamUnavailableError } from "@/lib/upstream-error";
import { TreasuryResponse } from "@/mappers/treasury";

import { TreasuryProvider } from "./providers";
import { LiquidTreasuryDataPoint, PriceProvider } from "./types";

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
  ): Promise<MaybeDegraded<TreasuryResponse>> {
    if (!this.provider) {
      return { data: { items: [], totalCount: 0 }, degraded: false };
    }

    const cutoffTimestamp = calculateCutoffTimestamp(days);

    let data: LiquidTreasuryDataPoint[];
    let degraded = false;
    try {
      data = await this.provider.fetchTreasury(cutoffTimestamp);
    } catch (error) {
      // Liquid treasury comes from Dune, DefiLlama or Compound. An outage
      // there must not 5xx: the gateway counts that against the whole DAO.
      // Same policy as the price routes: serve the last good series while it
      // is young enough, and only then fall to empty.
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      // A cached empty series is no fallback at all, so it is reported and
      // served as "empty" rather than as a stale value.
      const stale = this.provider.getStaleTreasury();
      const hasStale = stale !== null && stale.length > 0;
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: "treasury",
        mode: hasStale ? "stale" : "empty",
        reason: error.reason,
        error,
        context: { days },
      });
      if (!hasStale) {
        return { data: { items: [], totalCount: 0 }, degraded: true };
      }
      data = filterWithFallback(stale, cutoffTimestamp);
      degraded = true;
    }

    if (data.length === 0) {
      return { data: { items: [], totalCount: 0 }, degraded };
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

    return { data: { items, totalCount: items.length }, degraded };
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

    // Token quantities and the pre-window balance from PostgreSQL first.
    const [tokenQuantities, lastKnownQuantity] = await Promise.all([
      this.repository.getTokenQuantities(cutoffTimestamp),
      this.repository.getLastTokenQuantityBeforeDate(cutoffTimestamp),
    ]);

    // No transfer inside the window is not "no treasury": the balance from
    // before the window is what gets forward-filled across it. Only a DAO
    // that never held the token has nothing to show, and that is decided
    // before CoinGecko is asked at all: with nothing to price there is no
    // reason to wait on the provider or to record its outage as degrading
    // a treasury that is complete without it.
    if (tokenQuantities.size === 0 && lastKnownQuantity === null) {
      return { data: { items: [], totalCount: 0 }, degraded: false };
    }

    const { data: historicalPrices, degraded } =
      await this.fetchPricesOrDegrade(this.priceProvider, days);

    // With no prices every point would value at zero, which reads as the
    // treasury crashing to $0 rather than as missing data. Serve nothing.
    if (historicalPrices.size === 0) {
      return { data: { items: [], totalCount: 0 }, degraded };
    }

    // Normalize all timestamps to midnight UTC
    const normalizedQuantities = normalizeMapTimestamps(tokenQuantities);
    const normalizedPrices = normalizeMapTimestamps(historicalPrices);

    // Create timeline from first data point to today
    const timeline = createDailyTimeline(
      Math.min(...[...normalizedQuantities.keys(), ...normalizedPrices.keys()]),
    );

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
   * Prices for the token treasury. A CoinGecko outage degrades to an empty
   * series, never to zero-valued points, rather than a 5xx: the gateway counts
   * 5xx against the whole DAO's circuit breaker.
   */
  private async fetchPricesOrDegrade(
    priceProvider: PriceProvider,
    days: number,
  ): Promise<MaybeDegraded<Map<number, number>>> {
    try {
      return await priceProvider.getHistoricalPricesMap(days);
    } catch (error) {
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: "treasury",
        mode: "empty",
        reason: error.reason,
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
    const [liquid, token] = await Promise.all([
      this.getLiquidTreasury(days, order),
      this.getTokenTreasury(days, order, decimals),
    ]);
    const { data: liquidResult } = liquid;
    const { data: tokenResult } = token;
    const degraded = liquid.degraded || token.degraded;

    // A half that degraded to nothing makes the sum a lie: a token-only total
    // reads as the liquid treasury having vanished, not as missing data. Serve
    // nothing, as the token path already does one level down. A half that is
    // empty for a complete reason (no provider configured, no token held) is
    // not degraded and still sums.
    const liquidMissing = liquid.degraded && liquidResult.items.length === 0;
    const tokenMissing = token.degraded && tokenResult.items.length === 0;
    if (
      liquidMissing ||
      tokenMissing ||
      (liquidResult.items.length === 0 && tokenResult.items.length === 0)
    ) {
      return { data: { items: [], totalCount: 0 }, degraded };
    }

    // Joined by date, never by position: each series is built on its own
    // timeline, and a stale liquid series can start on a different day than
    // the token one.
    const byDate = new Map<number, number>();
    for (const { date, value } of [
      ...liquidResult.items,
      ...tokenResult.items,
    ]) {
      byDate.set(date, (byDate.get(date) ?? 0) + value);
    }
    const items = [...byDate.entries()]
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => (order === "desc" ? b.date - a.date : a.date - b.date));

    return { data: { items, totalCount: items.length }, degraded };
  }
}
