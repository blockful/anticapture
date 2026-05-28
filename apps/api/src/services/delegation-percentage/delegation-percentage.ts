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
 * 4. **skip / limit Pagination**
 *    - `startDate`/`endDate` are inclusive time-window filters.
 *    - `skip`/`limit` paginate the post-forward-fill timeline.
 *    - `totalCount` reflects the full filled timeline, ignoring skip/limit.
 */

import { MetricTypesEnum } from "@/lib/constants";
import { getEffectiveStartDate } from "@/lib/date-helpers";
import { forwardFill, generateOrderedTimeline } from "@/lib/time-series";
import { logger } from "@/logger";
import {
  DBTokenMetric,
  DelegationPercentageItem,
  DelegationPercentageQuery,
  normalizeTimestamp,
} from "@/mappers/";

/**
 * Service result type
 */
export interface DelegationPercentageServiceResult {
  items: DelegationPercentageItem[];
  totalCount: number;
}

interface DateData {
  delegated?: bigint;
  total?: bigint;
  daoId?: string;
  tokenId?: string;
}

export interface DelegationPercentageRepository {
  getMetricsByDateRange(filters: {
    metricTypes: string[];
    startDate?: string;
    endDate?: string;
    orderDirection: "asc" | "desc";
    limit?: number;
  }): Promise<DBTokenMetric[]>;

  getLastMetricBeforeDate(
    metricType: string,
    beforeDate: string,
  ): Promise<DBTokenMetric | undefined>;
}

export class DelegationPercentageService {
  constructor(private readonly repository: DelegationPercentageRepository) {}

  /**
   * Main method to get delegation percentage data with forward-fill and skip/limit pagination.
   */
  async delegationPercentageByDay(
    filters: DelegationPercentageQuery,
  ): Promise<DelegationPercentageServiceResult> {
    const { startDate, endDate, orderDirection = "asc", skip, limit } = filters;

    // Normalize all timestamps to midnight UTC to align with database storage
    const normalizedStartDate = startDate
      ? normalizeTimestamp(startDate)
      : undefined;
    const normalizedEndDate = endDate ? normalizeTimestamp(endDate) : undefined;

    // 1. Get initial values for proper forward-fill
    const initialValues = normalizedStartDate
      ? await this.fetchLastDelegationValues(normalizedStartDate)
      : { delegated: 0n, total: 0n };

    // 2. Fetch every metric row in the window — the timeline is built by
    //    forward-filling across those rows, then paginated post-build via
    //    skip/limit. Capping the repository read would drop later metric
    //    changes and freeze stale values across the tail of the timeline.
    const rows = await this.repository.getMetricsByDateRange({
      metricTypes: [
        MetricTypesEnum.DELEGATED_SUPPLY,
        MetricTypesEnum.TOTAL_SUPPLY,
      ],
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      orderDirection,
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
      return { items: [], totalCount: 0 };
    }

    // 5. Adjust startDate if no previous values and startDate is before first data
    // This prevents returning 0% for dates before first real data
    const datesFromDb = Array.from(dateMap.keys()).map(Number);
    const effectiveStartDate = getEffectiveStartDate({
      referenceDate: normalizedStartDate
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

    // 7. Calculate delegation percentage across the whole filled timeline
    const allItems = this.calculateDelegationPercentage(
      allDates,
      dateMap,
      initialValues,
    );

    // 8. Apply skip/limit
    const totalCount = allItems.length;
    const items = allItems.slice(skip, skip + limit);

    return { items, totalCount };
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
      logger.error({ err: error }, "error fetching initial values");
      return { delegated: 0n, total: 0n };
    }
  }

  /**
   * Organizes database rows into a map by date
   * Separates DELEGATED_SUPPLY and TOTAL_SUPPLY metrics
   */
  private organizeDateMap(rows: DBTokenMetric[]): Map<string, DateData> {
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
