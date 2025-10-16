import { MetricTypesEnum } from "@/lib/constants";
import {
  DelegationPercentageRepository,
  DaoMetricRow,
} from "@/api/repositories/delegation-percentage.repository";
import type {
  DelegationPercentageItem,
  PageInfo,
  DelegationPercentageResponse,
} from "@/api/mappers/delegation-percentage";

export interface DelegationPercentageFilters {
  after?: string;
  before?: string;
  startDate?: string;
  endDate?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
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
   * Main method to get delegation percentage data with forward-fill and pagination
   */
  async getDelegationPercentage(
    filters: DelegationPercentageFilters,
  ): Promise<DelegationPercentageResponse> {
    const {
      after,
      before,
      startDate,
      endDate,
      orderDirection = "asc",
      limit = 100,
    } = filters;

    // 1. Get initial values for proper forward-fill
    const referenceDate = startDate || after;
    const initialValues = referenceDate
      ? await this.getInitialValuesBeforeDate(referenceDate)
      : { delegated: 0n, total: 0n };

    // 2. Fetch data from repository
    const rows = await this.repository.getDaoMetricsByDateRange({
      startDate: referenceDate,
      endDate: endDate || before,
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
      return {
        items: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
      };
    }

    // 5. Adjust startDate if no previous values and startDate is before first data
    // This prevents returning 0% for dates before first real data
    const effectiveStartDate = this.adjustStartDateToFirstRealData(
      startDate,
      after,
      dateMap,
      initialValues,
    );

    // 6. Generate complete date range
    const allDates = this.generateDateRange(
      dateMap,
      effectiveStartDate,
      endDate,
      orderDirection,
    );

    // 7. Apply forward-fill and calculate percentage
    const allItems = this.applyForwardFill(allDates, dateMap, initialValues);

    // 8. Apply cursor-based pagination
    const { items, hasNextPage } = this.applyCursorPagination(
      allItems,
      after,
      before,
      limit,
    );

    // 9. Build page info
    const pageInfo = this.buildPageInfo(items, hasNextPage, after, before);

    return {
      items,
      totalCount: items.length,
      pageInfo,
    };
  }

  /**
   * Gets the last known values before a given date for proper forward-fill
   * Returns { delegated: 0n, total: 0n } if no previous values exist
   */
  private async getInitialValuesBeforeDate(
    beforeDate: string,
  ): Promise<{ delegated: bigint; total: bigint }> {
    try {
      const beforeTimestamp = (BigInt(beforeDate) - 86400n).toString();

      const [delegatedRow, totalRow] = await Promise.all([
        this.repository.getLastMetricValueBefore(
          MetricTypesEnum.DELEGATED_SUPPLY,
          beforeTimestamp,
        ),
        this.repository.getLastMetricValueBefore(
          MetricTypesEnum.TOTAL_SUPPLY,
          beforeTimestamp,
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
    const referenceDate = startDate || after;
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
  private organizeDateMap(rows: DaoMetricRow[]): Map<string, DateData> {
    const dateMap = new Map<string, DateData>();

    rows.forEach((row) => {
      const dateStr = row.date.toString();
      const existing = dateMap.get(dateStr) || {};

      if (row.metricType === MetricTypesEnum.DELEGATED_SUPPLY) {
        existing.delegated = row.high;
        existing.daoId = row.daoId;
        existing.tokenId = row.tokenId;
      } else if (row.metricType === MetricTypesEnum.TOTAL_SUPPLY) {
        existing.total = row.high;
        existing.daoId = row.daoId;
        existing.tokenId = row.tokenId;
      }

      dateMap.set(dateStr, existing);
    });

    return dateMap;
  }

  /**
   * Generates a complete date range based on available data
   * Fills gaps between first and last date with all days
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
    const lastDate = endDate
      ? BigInt(endDate)
      : datesFromDb[datesFromDb.length - 1];

    if (!firstDate || !lastDate) {
      return allDates;
    }

    // Generate all days in range (86400 seconds = 1 day)
    const ONE_DAY = 86400n;
    for (let date = firstDate; date <= lastDate; date += ONE_DAY) {
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
      // Returns as bigint with 18 decimal places for precision
      const percentage =
        lastTotal > 0n ? (lastDelegated * 100n * BigInt(1e18)) / lastTotal : 0n;

      return {
        date: dateStr,
        high: percentage.toString(),
      };
    });
  }

  /**
   * Applies cursor-based pagination (after/before) and limit
   */
  private applyCursorPagination(
    allItems: DelegationPercentageItem[],
    after?: string,
    before?: string,
    limit: number = 100,
  ): { items: DelegationPercentageItem[]; hasNextPage: boolean } {
    let filteredItems = allItems;

    // Apply cursor filters
    if (after) {
      const afterCursor = BigInt(after);
      filteredItems = filteredItems.filter(
        (item) => BigInt(item.date) > afterCursor,
      );
    }

    if (before) {
      const beforeCursor = BigInt(before);
      filteredItems = filteredItems.filter(
        (item) => BigInt(item.date) < beforeCursor,
      );
    }

    // Apply limit and detect hasNextPage
    const pageSize = limit;
    const itemsWithExtra = filteredItems.slice(0, pageSize + 1);
    const hasNextPage = itemsWithExtra.length > pageSize;
    const items = itemsWithExtra.slice(0, pageSize);

    return { items, hasNextPage };
  }

  /**
   * Builds the PageInfo object for pagination metadata
   */
  private buildPageInfo(
    items: DelegationPercentageItem[],
    hasNextPage: boolean,
    after?: string,
    before?: string,
  ): PageInfo {
    return {
      hasNextPage,
      hasPreviousPage: !!after || !!before,
      endCursor:
        items.length > 0 ? (items[items.length - 1]?.date ?? null) : null,
      startCursor: items.length > 0 ? (items[0]?.date ?? null) : null,
    };
  }
}
