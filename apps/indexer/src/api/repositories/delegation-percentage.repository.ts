import { db } from "ponder:api";
import { daoMetricsDayBucket } from "ponder:schema";
import { and, gte, lte, inArray, desc, asc } from "ponder";
import { MetricTypesEnum } from "@/lib/constants";
import type { RepositoryFilters } from "@/api/mappers/delegation-percentage";

export class DelegationPercentageRepository {
  /**
   * Fetches DELEGATED_SUPPLY and TOTAL_SUPPLY metrics from database
   * @param filters - Date range and ordering filters
   * @returns Array of metrics ordered by date
   */
  async getDaoMetricsByDateRange(filters: RepositoryFilters) {
    const { startDate, endDate, orderDirection, limit } = filters;

    const conditions = [
      inArray(daoMetricsDayBucket.metricType, [
        MetricTypesEnum.DELEGATED_SUPPLY,
        MetricTypesEnum.TOTAL_SUPPLY,
      ]),
    ];

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
    return await db.query.daoMetricsDayBucket.findFirst({
      where: and(
        lte(daoMetricsDayBucket.date, BigInt(beforeDate)),
        inArray(daoMetricsDayBucket.metricType, [metricType]),
      ),
      orderBy: desc(daoMetricsDayBucket.date),
    });
  }
}
