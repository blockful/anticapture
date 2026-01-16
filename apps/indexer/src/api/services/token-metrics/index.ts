/**
 * # Token Metrics Service
 *
 * Handles logic for retrieving token metrics with forward-fill.
 *
 * ## Data Storage Strategy
 * Database stores only value changes (sparse data), not daily records. Results in gaps between dates.
 *
 * ## Forward-Fill Strategy
 * The service fills gaps by carrying forward the last known value:
 *
 * Database: [Day1: 100] [Day5: 150] [Day10: 200]
 * Timeline: [Day1, Day2, Day3, Day4, Day5, Day6, Day7, Day8, Day9, Day10]
 * Result:   [100,  100,  100,  100,  150,  150,  150,  150,  150,  200]
 *
 * ## Edge Cases Handled
 *
 * 1. **Forward-Fill for Missing Dates**
 *    - Carries forward previous values when no new data exists for a date
 *
 * 2. **Multiple Metric Types**
 *    - Handles comma-separated types in single request
 *    - Each type is processed and forward-filled independently
 *
 * 3. **No data before start date**
 *    - Returns data starting from first available data point
 */

import { getCurrentDayTimestamp } from "@/lib/enums";
import {
  createDailyTimeline,
  forwardFill,
  truncateTimestampToMidnight,
  normalizeMapTimestamps,
} from "@/lib/time-series";
import { TokenMetricsRepository } from "@/api/repositories/token-metrics";
import {
  TokenMetricsQuery,
  TokenMetricItem,
  TokenMetricsServiceResult,
} from "@/api/mappers/token-metrics";

interface MetricData {
  high: bigint;
  volume: bigint;
  low?: bigint;
  open?: bigint;
  close?: bigint;
  average?: bigint;
  count?: number;
}

export class TokenMetricsService {
  constructor(private readonly repository: TokenMetricsRepository) {}

  /**
   * Get metrics with forward-fill for multiple types
   * Returns results keyed by metric type
   */
  async getMetrics(
    filters: TokenMetricsQuery,
  ): Promise<TokenMetricsServiceResult> {
    const {
      type: metricTypes,
      startDate,
      endDate,
      orderDirection,
      limit,
      after,
      before,
    } = filters;

    // Normalize all timestamps to midnight UTC
    const normalizedStartDate = startDate
      ? truncateTimestampToMidnight(startDate)
      : undefined;
    const normalizedEndDate = endDate
      ? truncateTimestampToMidnight(endDate)
      : undefined;
    const normalizedAfter = after
      ? truncateTimestampToMidnight(after)
      : undefined;
    const normalizedBefore = before
      ? truncateTimestampToMidnight(before)
      : undefined;

    const result: TokenMetricsServiceResult = {};

    // Process each metric type
    for (const metricType of metricTypes) {
      const typeResult = await this.getMetricsForType({
        metricType,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        orderDirection,
        limit,
        after: normalizedAfter,
        before: normalizedBefore,
      });

      result[metricType] = typeResult;
    }

    return result;
  }

  /**
   * Get metrics for a single type with forward-fill
   */
  private async getMetricsForType(params: {
    metricType: string;
    startDate?: number;
    endDate?: number;
    orderDirection: "asc" | "desc";
    limit: number;
    after?: number;
    before?: number;
  }): Promise<{
    items: TokenMetricItem[];
    hasNextPage: boolean;
    startDate: string | null;
    endDate: string | null;
  }> {
    const {
      metricType,
      startDate,
      endDate,
      orderDirection,
      limit,
      after,
      before,
    } = params;

    // Determine reference date for initial values
    const referenceDate = after ?? startDate;

    // 1. Get initial value for proper forward-fill
    const initialValue = referenceDate
      ? await this.fetchLastMetricValue(metricType, referenceDate)
      : undefined;

    // 2. Fetch sparse data from repository
    const rows = await this.repository.getMetricsByDateRange({
      metricTypes: [metricType],
      startDate: referenceDate?.toString(),
      endDate: (before ?? endDate)?.toString(),
      orderDirection,
      limit: limit + 1, // Fetch one extra to check hasNextPage
    });

    // 3. If no data and no initial value, return empty
    if (rows.length === 0 && !initialValue) {
      return {
        items: [],
        hasNextPage: false,
        startDate: null,
        endDate: null,
      };
    }

    // 4. Build date map from rows
    const dateMap = new Map<number, MetricData>();
    rows.forEach((row) => {
      const date = Number(row.date);
      dateMap.set(date, {
        high: row.high,
        volume: row.volume,
      });
    });

    // 5. Determine effective start date
    const effectiveStartDate = this.getEffectiveStartDate(
      startDate,
      after,
      dateMap,
      initialValue,
    );

    // 6. Generate timeline and apply forward-fill
    const timeline = this.generateTimeline(
      dateMap,
      effectiveStartDate,
      endDate,
      orderDirection,
    );

    if (timeline.length === 0) {
      return {
        items: [],
        hasNextPage: false,
        startDate: null,
        endDate: null,
      };
    }

    // 7. Apply forward-fill
    const filledItems = this.applyForwardFill(timeline, dateMap, initialValue);

    // 8. Apply cursor pagination
    const { items, hasNextPage } = this.applyCursorPagination(
      filledItems,
      after,
      before,
      limit,
      endDate,
    );

    return {
      items,
      hasNextPage,
      startDate: items[0]?.date ?? null,
      endDate: items[items.length - 1]?.date ?? null,
    };
  }

  /**
   * Fetch the last known value for a metric type before a date
   */
  private async fetchLastMetricValue(
    metricType: string,
    beforeDate: number,
  ): Promise<MetricData | undefined> {
    try {
      const row = await this.repository.getLastMetricBeforeDate(
        metricType,
        beforeDate.toString(),
      );

      if (row) {
        return {
          high: row.high,
          volume: row.volume,
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching initial value:", error);
      return undefined;
    }
  }

  /**
   * Get effective start date, adjusting if needed based on available data
   */
  private getEffectiveStartDate(
    startDate: number | undefined,
    after: number | undefined,
    dateMap: Map<number, MetricData>,
    initialValue: MetricData | undefined,
  ): number | undefined {
    const referenceDate = after ?? startDate;
    if (!referenceDate) return undefined;

    // If we have initial value, use the reference date as is
    if (initialValue) {
      return referenceDate;
    }

    // If no initial value and no data, return first available date
    if (dateMap.size === 0) {
      return referenceDate;
    }

    // Find first date in data
    const datesFromDb = Array.from(dateMap.keys()).sort((a, b) => a - b);
    const firstRealDate = datesFromDb[0];

    // If reference date is before first real data, use first real date
    if (firstRealDate && referenceDate < firstRealDate) {
      return firstRealDate;
    }

    return referenceDate;
  }

  /**
   * Generate complete daily timeline
   */
  private generateTimeline(
    dateMap: Map<number, MetricData>,
    startDate?: number,
    endDate?: number,
    orderDirection?: "asc" | "desc",
  ): number[] {
    if (dateMap.size === 0 && !startDate) {
      return [];
    }

    const datesFromDb = Array.from(dateMap.keys()).sort((a, b) => a - b);

    const firstDate = startDate ?? datesFromDb[0];
    const lastDate = endDate ?? Number(getCurrentDayTimestamp());

    if (!firstDate || !lastDate) {
      return [];
    }

    const timeline = createDailyTimeline(firstDate, lastDate);

    if (orderDirection === "desc") {
      timeline.reverse();
    }

    return timeline;
  }

  /**
   * Apply forward-fill to create complete data series
   */
  private applyForwardFill(
    timeline: number[],
    dateMap: Map<number, MetricData>,
    initialValue?: MetricData,
  ): TokenMetricItem[] {
    // Convert dateMap to Maps for forward-fill
    const highMap = new Map<number, bigint>();
    const volumeMap = new Map<number, bigint>();

    for (const [date, data] of dateMap) {
      highMap.set(date, data.high);
      volumeMap.set(date, data.volume);
    }

    // Normalize timestamps to midnight UTC before forward-fill
    const normalizedHighMap = normalizeMapTimestamps(highMap);
    const normalizedVolumeMap = normalizeMapTimestamps(volumeMap);

    // Apply forward-fill
    const filledHigh = forwardFill(
      timeline,
      normalizedHighMap,
      initialValue?.high,
    );
    const filledVolume = forwardFill(
      timeline,
      normalizedVolumeMap,
      initialValue?.volume,
    );

    // Build result array
    return timeline
      .filter((date) => filledHigh.has(date)) // Only include dates with data
      .map((date) => ({
        date: date.toString(),
        high: (filledHigh.get(date) ?? 0n).toString(),
        volume: (filledVolume.get(date) ?? 0n).toString(),
      }));
  }

  /**
   * Apply cursor-based pagination
   */
  private applyCursorPagination(
    allItems: TokenMetricItem[],
    after?: number,
    before?: number,
    limit: number = 365,
    endDate?: number,
  ): { items: TokenMetricItem[]; hasNextPage: boolean } {
    // Apply cursor filters
    const filteredItems = allItems
      .filter((item) => !after || Number(item.date) > after)
      .filter((item) => !before || Number(item.date) < before);

    // Apply limit
    const items = filteredItems.slice(0, limit);

    // Determine hasNextPage
    let hasNextPage: boolean;
    if (endDate) {
      hasNextPage = filteredItems.length > limit;
    } else {
      const today = Number(getCurrentDayTimestamp());
      const lastItem = items[items.length - 1];
      const lastItemDate = lastItem ? Number(lastItem.date) : 0;
      hasNextPage = filteredItems.length > limit && lastItemDate < today;
    }

    return { items, hasNextPage };
  }
}
