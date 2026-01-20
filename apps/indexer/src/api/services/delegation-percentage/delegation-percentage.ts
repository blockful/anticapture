/**
 * # Delegation Percentage Service
 *
 * Handles logic for calculating delegation percentage over time with data consistency guarantees.
 *
 * ## Data Storage Strategy
 * Database stores only value changes (sparse data), not daily records. Results in gaps between dates.
 *
 * ## Edge Cases Handled
 *
 * 1. **Forward-Fill for Missing Dates**
 *    - Carries forward previous values when no new data exists for a date
 *    - Ensures consecutive daily data despite database gaps
 *
 * 2. **Date Range Outside Available Data**
 *    - Returns empty if requested range is completely before first available data
 *    - Returns intersection only if partially overlapping (never extrapolates backwards)
 *
 * 3. **Consecutive Daily Results**
 *    - Guarantees consecutive days in response, even with sparse database records
 *    - Process: generate complete date range → apply forward-fill → return consecutive days
 *
 * 4. **Cursor-Based Date Filtering**
 *    - `after`/`before` are date filters, not navigation cursors
 *    - Repository receives effective range for efficient queries
 *
 */

import { MetricTypesEnum } from "@/lib/constants";
import { forwardFill, generateOrderedTimeline } from "@/lib/time-series";
import { applyCursorPagination } from "@/lib/query-helpers";
import { getEffectiveStartDate } from "@/lib/date-helpers";
import { DaoMetricsDayBucketRepository } from "@/api/repositories/";
import {
  DelegationPercentageItem,
  DelegationPercentageQuery,
  normalizeTimestamp,
} from "@/api/mappers/";

/**
 * Service result type
 * Returns flat structure with pagination metadata
 */
export interface DelegationPercentageServiceResult {
  items: DelegationPercentageItem[];
  totalCount: number;
  hasNextPage: boolean;
  endDate: string | null;
  startDate: string | null;
}

interface DateData {
  delegated?: bigint;
  total?: bigint;
  daoId?: string;
  tokenId?: string;
}

export class DelegationPercentageService {
  constructor(private readonly repository: DaoMetricsDayBucketRepository) {}

  /**
   * Main method to get delegation percentage data with forward-fill and pagination
   */
  async delegationPercentageByDay(
    filters: DelegationPercentageQuery,
  ): Promise<DelegationPercentageServiceResult> {
    const { after, before, startDate, endDate, orderDirection, limit } =
      filters;

    // Normalize all timestamps to midnight UTC to align with database storage
    const normalizedStartDate = startDate
      ? normalizeTimestamp(startDate)
      : undefined;
    const normalizedEndDate = endDate ? normalizeTimestamp(endDate) : undefined;
    const normalizedAfter = after ? normalizeTimestamp(after) : undefined;
    const normalizedBefore = before ? normalizeTimestamp(before) : undefined;

    // 1. Get initial values for proper forward-fill
    const referenceDate = normalizedAfter || normalizedStartDate;
    const initialValues = referenceDate
      ? await this.fetchLastDelegationValues(referenceDate)
      : { delegated: 0n, total: 0n };

    // 2. Fetch data from repository
    const rows = await this.repository.getMetricsByDateRange({
      metricTypes: [
        MetricTypesEnum.DELEGATED_SUPPLY,
        MetricTypesEnum.TOTAL_SUPPLY,
      ],
      startDate: referenceDate,
      endDate: normalizedBefore || normalizedEndDate,
      orderDirection,
      limit: (limit + 1) * 2, // The limit is doubled to ensure we get all delegation and total supply values
    });

    // 3. Organize data by date
    const dateMap = this.organizeDateMap(rows);

    // 4. If no data found and no initial values, return empty
    // This happens when startDate is before any available data
    if (
      dateMap.size === 0 &&
      initialValues.delegated === 0n &&
      initialValues.total === 0n
    ) {
      return {
        items: [],
        totalCount: 0,
        hasNextPage: false,
        endDate: null,
        startDate: null,
      };
    }

    // 5. Adjust startDate if no previous values and startDate is before first data
    // This prevents returning 0% for dates before first real data
    const datesFromDb = Array.from(dateMap.keys()).map(Number);
    const effectiveStartDate = getEffectiveStartDate({
      referenceDate: normalizedAfter
        ? Number(normalizedAfter)
        : normalizedStartDate
          ? Number(normalizedStartDate)
          : undefined,
      datesFromDb,
      hasInitialValue:
        initialValues.delegated !== 0n || initialValues.total !== 0n,
    });

    // 6. Generate complete date range
    const allDates = generateOrderedTimeline({
      datesFromDb,
      startDate: effectiveStartDate,
      endDate: normalizedEndDate ? Number(normalizedEndDate) : undefined,
      orderDirection,
    });

    // 7. Calculate delegation percentage
    const allItems = this.calculateDelegationPercentage(
      allDates,
      dateMap,
      initialValues,
    );

    // 8. Apply cursor-based pagination
    const { items, hasNextPage } = applyCursorPagination({
      items: allItems,
      after: normalizedAfter ? Number(normalizedAfter) : undefined,
      before: normalizedBefore ? Number(normalizedBefore) : undefined,
      limit,
      endDate: normalizedEndDate ? Number(normalizedEndDate) : undefined,
    });
    return {
      items,
      totalCount: items.length,
      hasNextPage,
      endDate: items[items.length - 1]?.date ?? null,
      startDate: items[0]?.date ?? null,
    };
  }

  /**
   * Gets the last known values at or before a given date for proper forward-fill
   * Returns { delegated: 0n, total: 0n } if no previous values exist
   */
  private async fetchLastDelegationValues(
    beforeDate: string,
  ): Promise<{ delegated: bigint; total: bigint }> {
    try {
      const [delegatedRow, totalRow] = await Promise.all([
        this.repository.getLastMetricBeforeDate(
          MetricTypesEnum.DELEGATED_SUPPLY,
          beforeDate,
        ),
        this.repository.getLastMetricBeforeDate(
          MetricTypesEnum.TOTAL_SUPPLY,
          beforeDate,
        ),
      ]);

      return {
        delegated: delegatedRow?.high ?? 0n,
        total: totalRow?.high ?? 0n,
      };
    } catch (error) {
      console.error("Error fetching initial values:", error);
      return { delegated: 0n, total: 0n };
    }
  }

  /**
   * Organizes database rows into a map by date
   * Separates DELEGATED_SUPPLY and TOTAL_SUPPLY metrics
   */
  private organizeDateMap(
    rows: Awaited<
      ReturnType<DaoMetricsDayBucketRepository["getMetricsByDateRange"]>
    >,
  ): Map<string, DateData> {
    const dateMap = new Map<string, DateData>();

    rows.forEach((row) => {
      const dateStr = row.date.toString();
      const existing = dateMap.get(dateStr) || {};

      if (row.metricType === MetricTypesEnum.DELEGATED_SUPPLY) {
        existing.delegated = row.high;
      } else if (row.metricType === MetricTypesEnum.TOTAL_SUPPLY) {
        existing.total = row.high;
      }

      existing.daoId = row.daoId;
      existing.tokenId = row.tokenId;

      dateMap.set(dateStr, existing);
    });

    return dateMap;
  }

  /**
   * Calculates delegation percentage
   */
  private calculateDelegationPercentage(
    allDates: number[],
    dateMap: Map<string, DateData>,
    initialValues: { delegated: bigint; total: bigint } = {
      delegated: 0n,
      total: 0n,
    },
  ): DelegationPercentageItem[] {
    const delegatedMap = new Map<number, bigint>();
    const totalMap = new Map<number, bigint>();
    for (const [dateStr, data] of dateMap) {
      const date = Number(dateStr);
      if (data.delegated !== undefined) delegatedMap.set(date, data.delegated);
      if (data.total !== undefined) totalMap.set(date, data.total);
    }
    const filledDelegated = forwardFill(
      allDates,
      delegatedMap,
      initialValues.delegated,
    );
    const filledTotal = forwardFill(allDates, totalMap, initialValues.total);

    // Calculate percentage for each date
    return allDates.map((date) => {
      const delegated = filledDelegated.get(date) ?? 0n;
      const total = filledTotal.get(date) ?? 0n;
      const percentage =
        total > 0n ? Number((delegated * 10000n) / total) / 100 : 0;

      return {
        date: date.toString(),
        high: percentage.toFixed(2),
      };
    });
  }
}
