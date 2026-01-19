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
 * 2. **No data before start date**
 *    - Returns data starting from first available data point
 */

import { forwardFill, generateOrderedTimeline } from "@/lib/time-series";
import { applyCursorPagination } from "@/lib/query-helpers";
import {
  normalizeMapTimestamps,
  getEffectiveStartDate,
} from "@/lib/date-helpers";
import { TokenMetricsRepository } from "@/api/repositories/token-metrics";
import { TokenMetricItem } from "@/api/mappers/token-metrics";
import { MetricTypesEnum } from "@/lib/constants";

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
   * Get metrics for a single type with forward-fill
   */
  async getMetricsForType(params: {
    metricType: MetricTypesEnum;
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
      metricType,
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
    const datesFromDb = Array.from(dateMap.keys());
    const effectiveStartDate = getEffectiveStartDate({
      referenceDate: after ?? startDate,
      datesFromDb,
      hasInitialValue: initialValue !== undefined,
    });

    // 6. Generate timeline and apply forward-fill
    const timeline = generateOrderedTimeline({
      datesFromDb,
      startDate: effectiveStartDate,
      endDate,
      orderDirection,
    });

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
    const { items, hasNextPage } = applyCursorPagination({
      items: filledItems,
      after,
      before,
      limit,
      endDate,
    });

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
}
