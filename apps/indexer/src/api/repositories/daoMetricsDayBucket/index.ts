import { db } from "ponder:api";
import { daoMetricsDayBucket } from "ponder:schema";
import { and, gte, lte, desc, asc, eq, lt, inArray } from "ponder";

export class DaoMetricsDayBucketRepository {
  /**
   * Fetches metrics by type and date range
   * @param filters - Metric types, date range, and ordering filters
   * @returns Array of metrics ordered by date
   */
  async getMetricsByDateRange(filters: {
    metricTypes: string[];
    startDate?: string;
    endDate?: string;
    orderDirection: "asc" | "desc";
    limit: number;
  }) {
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
   * @param beforeDate - The date to search before
   * @returns The most recent metric row or null if not found
   */
  async getLastMetricBeforeDate(metricType: string, beforeDate: string) {
    return db.query.daoMetricsDayBucket.findFirst({
      where: and(
        lt(daoMetricsDayBucket.date, BigInt(beforeDate)),
        eq(daoMetricsDayBucket.metricType, metricType),
      ),
      orderBy: desc(daoMetricsDayBucket.date),
    });
  }
}
