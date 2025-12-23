import { db } from "ponder:api";
import { daoMetricsDayBucket } from "ponder:schema";
import { and, eq, gte, lte, desc } from "ponder";
import { MetricTypesEnum } from "@/lib/constants";

/**
 * Repository for treasury-related database queries.
 */
export class TreasuryRepository {
  /**
   * Fetch DAO token quantities from daoMetricsDayBucket table
   * @param cutoffTimestamp - The timestamp to filter the data
   * @returns Map of timestamp (ms) to token quantity (bigint)
   */
  async getTokenQuantities(
    cutoffTimestamp: number,
  ): Promise<Map<number, bigint>> {
    const results = await db.query.daoMetricsDayBucket.findMany({
      columns: {
        date: true,
        close: true,
      },
      where: and(
        eq(daoMetricsDayBucket.metricType, MetricTypesEnum.TREASURY),
        gte(daoMetricsDayBucket.date, BigInt(cutoffTimestamp)),
      ),
      orderBy: (fields, { asc }) => [asc(fields.date)],
    });

    const map = new Map<number, bigint>();
    results.forEach((item) => {
      const timestampMs = Number(item.date) * 1000;
      map.set(timestampMs, item.close);
    });

    return map;
  }

  /**
   * Fetch the last token quantity before a given cutoff timestamp.
   * Used to get initial value for forward-fill when no data exists in the requested range.
   * @param cutoffTimestamp - The timestamp to search before
   * @returns The last known token quantity or null if not found
   */
  async getLastTokenQuantityBeforeDate(
    cutoffTimestamp: number,
  ): Promise<bigint | null> {
    const result = await db.query.daoMetricsDayBucket.findFirst({
      where: and(
        eq(daoMetricsDayBucket.metricType, MetricTypesEnum.TREASURY),
        lte(daoMetricsDayBucket.date, BigInt(cutoffTimestamp)),
      ),
      orderBy: desc(daoMetricsDayBucket.date),
    });
    return result?.close ?? null;
  }
}
