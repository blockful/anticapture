import { db } from "ponder:api";
import { daoMetricsDayBucket } from "ponder:schema";
import { and, gte, lte, lt, inArray, desc, asc } from "ponder";

export interface TokenMetricsRepositoryFilters {
  metricTypes: string[];
  startDate?: string;
  endDate?: string;
  orderDirection: "asc" | "desc";
  limit: number;
}

export class TokenMetricsRepository {
  /**
   * Fetches metrics by types and date range
   * @param filters - Metric types, date range, and ordering filters
   * @returns Array of metrics ordered by date
   */
  async getMetricsByDateRange(filters: TokenMetricsRepositoryFilters) {
    const { metricTypes, startDate, endDate, orderDirection, limit } = filters;

    const conditions = [inArray(daoMetricsDayBucket.metricType, metricTypes)];

    if (startDate) {
      conditions.push(gte(daoMetricsDayBucket.date, BigInt(startDate)));
    }
    if (endDate) {
      conditions.push(lte(daoMetricsDayBucket.date, BigInt(endDate)));
    }

    return db.query.daoMetricsDayBucket.findMany({
      where: and(...conditions),
      limit,
      orderBy:
        orderDirection === "desc"
          ? desc(daoMetricsDayBucket.date)
          : asc(daoMetricsDayBucket.date),
    });
  }

  /**
   * Fetches the last value of a specific metric type before a given date
   * @param metricType - The metric type to search for
   * @param beforeDate - The date to search before (exclusive)
   * @returns The most recent metric row or null if not found
   */
  async getLastMetricBeforeDate(metricType: string, beforeDate: string) {
    return db.query.daoMetricsDayBucket.findFirst({
      where: and(
        lt(daoMetricsDayBucket.date, BigInt(beforeDate)),
        inArray(daoMetricsDayBucket.metricType, [metricType]),
      ),
      orderBy: desc(daoMetricsDayBucket.date),
    });
  }
}
