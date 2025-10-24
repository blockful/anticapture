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
import { SECONDS_IN_DAY, getCurrentDayTimestamp } from "@/lib/enums";
import { DelegationPercentageRepository } from "@/api/repositories/delegation-percentage.repository";
import type {
  DelegationPercentageItem,
  DelegationPercentageQuery,
} from "@/api/mappers/delegation-percentage";

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
  constructor(private readonly repository: DelegationPercentageRepository) {}

  /**
   * Normalizes a timestamp to midnight UTC (00:00:00)
   * This ensures alignment with database timestamps which are always stored at midnight
   * @param timestamp - Unix timestamp in seconds as string
   * @returns Normalized timestamp at midnight UTC
   */
  private normalizeTimestamp(timestamp: string): string {
    const ts = BigInt(timestamp);
    const midnight = (ts / BigInt(SECONDS_IN_DAY)) * BigInt(SECONDS_IN_DAY);
    return midnight.toString();
  }

  /**
   * Main method to get delegation percentage data with forward-fill and pagination
   */
  async getDelegationPercentage(
    filters: DelegationPercentageQuery,
  ): Promise<DelegationPercentageServiceResult> {
    const {
      after,
      before,
      startDate,
      endDate,
      orderDirection = "asc",
      limit = 366,
    } = filters;

    // Normalize all timestamps to midnight UTC to align with database storage
    const normalizedStartDate = startDate
      ? this.normalizeTimestamp(startDate)
      : undefined;
    const normalizedEndDate = endDate
      ? this.normalizeTimestamp(endDate)
      : undefined;
    const normalizedAfter = after ? this.normalizeTimestamp(after) : undefined;
    const normalizedBefore = before
      ? this.normalizeTimestamp(before)
      : undefined;

    // 1. Get initial values for proper forward-fill
    const referenceDate = normalizedAfter || normalizedStartDate;
    const initialValues = referenceDate
      ? await this.getInitialValuesBeforeDate(referenceDate)
      : { delegated: 0n, total: 0n };

    // 2. Fetch data from repository
    const rows = await this.repository.getDaoMetricsByDateRange({
      startDate: referenceDate,
      endDate: normalizedBefore || normalizedEndDate,
      orderDirection,
      limit: limit + 1, // Necessary to check if there is a next page
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
    const effectiveStartDate = this.adjustStartDateToFirstRealData(
      normalizedStartDate,
      normalizedAfter,
      dateMap,
      initialValues,
    );

    // 6. Generate complete date range
    const allDates = this.generateDateRange(
      dateMap,
      effectiveStartDate,
      normalizedEndDate,
      orderDirection,
    );

    // 7. Apply forward-fill and calculate percentage
    const allItems = this.applyForwardFill(allDates, dateMap, initialValues);

    // 8. Apply cursor-based pagination
    const { items, hasNextPage } = this.applyCursorPagination(
      allItems,
      normalizedAfter,
      normalizedBefore,
      limit,
      normalizedEndDate,
    );
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
  private async getInitialValuesBeforeDate(
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
   * Adjusts startDate to the first real data date if requested startDate is before any data
   * Returns the original startDate if it's within or after available data range
   */
  private adjustStartDateToFirstRealData(
    startDate: string | undefined,
    after: string | undefined,
    dateMap: Map<string, DateData>,
    initialValues: { delegated: bigint; total: bigint },
  ): string | undefined {
    const referenceDate = after || startDate;
    if (!referenceDate) return undefined;

    if (
      initialValues.delegated !== 0n ||
      initialValues.total !== 0n ||
      dateMap.size === 0
    ) {
      return referenceDate;
    }

    const datesFromDb = Array.from(dateMap.keys())
      .map((d) => BigInt(d))
      .sort((a, b) => Number(a - b));
    const firstRealDate = datesFromDb[0];

    if (firstRealDate && BigInt(referenceDate) < firstRealDate) {
      return firstRealDate.toString();
    }

    return referenceDate;
  }

  /**
   * Organizes database rows into a map by date
   * Separates DELEGATED_SUPPLY and TOTAL_SUPPLY metrics
   */
  private organizeDateMap(
    rows: Awaited<
      ReturnType<DelegationPercentageRepository["getDaoMetricsByDateRange"]>
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
   * Generates a complete date range based on available data
   * Fills gaps between first and last date with all days
   * If endDate is not provided, uses current day (today) for forward-fill
   */
  private generateDateRange(
    dateMap: Map<string, DateData>,
    startDate?: string,
    endDate?: string,
    orderDirection: "asc" | "desc" = "asc",
  ): bigint[] {
    const allDates: bigint[] = [];

    if (dateMap.size === 0) {
      return allDates;
    }

    const datesFromDb = Array.from(dateMap.keys())
      .map((d) => BigInt(d))
      .sort((a, b) => Number(a - b));

    const firstDate = startDate ? BigInt(startDate) : datesFromDb[0];
    const lastDate = endDate ? BigInt(endDate) : getCurrentDayTimestamp();

    if (!firstDate || !lastDate) {
      return allDates;
    }

    // Generate all days in range
    for (
      let date = firstDate;
      date <= lastDate;
      date += BigInt(SECONDS_IN_DAY)
    ) {
      allDates.push(date);
    }

    if (orderDirection === "desc") {
      allDates.reverse();
    }

    return allDates;
  }

  /**
   * Applies forward-fill logic and calculates delegation percentage
   * Forward-fill: carries forward the last known value for missing dates
   */
  private applyForwardFill(
    allDates: bigint[],
    dateMap: Map<string, DateData>,
    initialValues: { delegated: bigint; total: bigint } = {
      delegated: 0n,
      total: 0n,
    },
  ): DelegationPercentageItem[] {
    let lastDelegated = initialValues.delegated;
    let lastTotal = initialValues.total;

    return allDates.map((date) => {
      const dateStr = date.toString();
      const data = dateMap.get(dateStr);

      // Update known values (forward-fill)
      if (data?.delegated !== undefined) lastDelegated = data.delegated;
      if (data?.total !== undefined) lastTotal = data.total;

      // Calculate percentage (avoid division by zero)
      // Returns as string with 2 decimal places (e.g., "11.74" for 11.74%)
      const percentage =
        lastTotal > 0n ? Number((lastDelegated * 10000n) / lastTotal) / 100 : 0;

      return {
        date: dateStr,
        high: percentage.toFixed(2),
      };
    });
  }

  /**
   * Applies cursor-based pagination (after/before) and limit
   * When endDate is not provided, hasNextPage considers if data reaches today
   */
  private applyCursorPagination(
    allItems: DelegationPercentageItem[],
    after?: string,
    before?: string,
    limit: number = 100,
    endDate?: string,
  ): { items: DelegationPercentageItem[]; hasNextPage: boolean } {
    // Apply cursor filters
    const filteredItems = allItems
      .filter((item) => !after || BigInt(item.date) > BigInt(after))
      .filter((item) => !before || BigInt(item.date) < BigInt(before));

    // Apply limit
    const items = filteredItems.slice(0, limit);

    // Determine hasNextPage
    let hasNextPage: boolean;
    if (endDate) {
      // If endDate is provided, use traditional pagination logic
      hasNextPage = filteredItems.length > limit;
    } else {
      // If endDate is not provided, check if last item reached today
      // hasNextPage = true only if we have more data AND haven't reached today yet
      const today = getCurrentDayTimestamp();
      const lastItem = items[items.length - 1];
      const lastItemDate = lastItem ? BigInt(lastItem.date) : 0n;
      hasNextPage = filteredItems.length > limit && lastItemDate < today;
    }

    return { items, hasNextPage };
  }
}
