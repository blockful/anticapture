import { db } from "ponder:api";
import { daoMetricsDayBucket } from "ponder:schema";
import { and, gte, lte, inArray, SQL } from "ponder";
import { MetricTypesEnum } from "@/lib/constants";

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
    const { startDate, endDate, orderDirection = "asc" } = filters;

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

    const rows = await db
      .select()
      .from(daoMetricsDayBucket)
      .where(and(...queryFilters.filter(Boolean)))
      .orderBy(
        daoMetricsDayBucket.date,
        orderDirection === "desc" ? "desc" : "asc",
      );

    return rows as DaoMetricRow[];
  }
}
