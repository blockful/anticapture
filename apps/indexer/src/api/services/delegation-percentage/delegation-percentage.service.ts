import { MetricTypesEnum } from "@/lib/constants";
import {
  DelegationPercentageRepository,
  DaoMetricRow,
} from "@/api/repositories/delegation-percentage.repository";

export interface DelegationPercentageItem {
  date: string;
  high: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

export interface DelegationPercentageResponse {
  items: DelegationPercentageItem[];
  totalCount: number;
  pageInfo: PageInfo;
}

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

    // 1. Fetch data from repository
    const rows = await this.repository.getDaoMetricsByDateRange({
      startDate,
      endDate,
      orderDirection,
    });

    // 2. Organize data by date
    const dateMap = this.organizeDateMap(rows);

    // 3. Generate complete date range
    const allDates = this.generateDateRange(
      dateMap,
      startDate,
      endDate,
      orderDirection,
    );

    // 4. Apply forward-fill and calculate percentage
    const allItems = this.applyForwardFill(allDates, dateMap);

    // 5. Apply cursor-based pagination
    const { items, hasNextPage } = this.applyCursorPagination(
      allItems,
      after,
      before,
      limit,
    );

    // 6. Build page info
    const pageInfo = this.buildPageInfo(items, hasNextPage, after, before);

    return {
      items,
      totalCount: items.length,
      pageInfo,
    };
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
  ): DelegationPercentageItem[] {
    let lastDelegated = 0n;
    let lastTotal = 0n;

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
      endCursor: items.length > 0 ? items[items.length - 1].date : null,
      startCursor: items.length > 0 ? items[0].date : null,
    };
  }
}
