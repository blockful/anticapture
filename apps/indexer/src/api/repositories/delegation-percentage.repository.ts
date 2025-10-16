import { db } from "ponder:api";
import { daoMetricsDayBucket } from "ponder:schema";
import { and, gte, lte, inArray, desc, asc } from "ponder";
import { MetricTypesEnum } from "@/lib/constants";
import type { SQL } from "drizzle-orm";

export interface DaoMetricRow {
  date: bigint;
  daoId: string;
  tokenId: string;
  metricType: string;
  high: bigint;
}

export interface DaoMetricsFilters {
  startDate?: string;
  endDate?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
}

export class DelegationPercentageRepository {
  /**
   * Fetches DELEGATED_SUPPLY and TOTAL_SUPPLY metrics from database
   * @param filters - Date range and ordering filters
   * @returns Array of metrics ordered by date
   */
  async getDaoMetricsByDateRange(
    filters: DaoMetricsFilters,
  ): Promise<DaoMetricRow[]> {
    const { startDate, endDate, orderDirection = "asc", limit } = filters;

    const queryFilters: (SQL | undefined)[] = [
      inArray(daoMetricsDayBucket.metricType, [
        MetricTypesEnum.DELEGATED_SUPPLY,
        MetricTypesEnum.TOTAL_SUPPLY,
      ]),
    ];

    if (startDate) {
      queryFilters.push(gte(daoMetricsDayBucket.date, BigInt(startDate)));
    }
    if (endDate) {
      queryFilters.push(lte(daoMetricsDayBucket.date, BigInt(endDate)));
    }

    const baseQuery = db
      .select()
      .from(daoMetricsDayBucket)
      .where(and(...queryFilters.filter(Boolean)))
      .orderBy(
        orderDirection === "desc"
          ? desc(daoMetricsDayBucket.date)
          : asc(daoMetricsDayBucket.date),
      );

    const rows =
      limit !== undefined ? await baseQuery.limit(limit) : await baseQuery;

    return rows as DaoMetricRow[];
  }

  /**
   * Fetches the last value of a specific metric type before a given date
   * @param metricType - The metric type to search for
   * @param beforeDate - The date to search before
   * @returns The most recent metric row or null if not found
   */
  async getLastMetricValueBefore(
    metricType: string,
    beforeDate: string,
  ): Promise<DaoMetricRow | null> {
    const rows = await db
      .select()
      .from(daoMetricsDayBucket)
      .where(
        and(
          lte(daoMetricsDayBucket.date, BigInt(beforeDate)),
          inArray(daoMetricsDayBucket.metricType, [metricType]),
        ),
      )
      .orderBy(desc(daoMetricsDayBucket.date))
      .limit(1);

    return rows[0] ? (rows[0] as DaoMetricRow) : null;
  }
}
