import { db } from "ponder:api";
import { inArray } from "ponder";
import { daoMetricsDayBucket } from "ponder:schema";

import { ChartType } from "../mappers/last-update";
import { MetricTypesEnum } from "@/lib/constants";

export interface LastUpdateRepository {
  getLastUpdate(chart: ChartType): Promise<bigint | undefined>;
}

export class LastUpdateRepositoryImpl implements LastUpdateRepository {
  async getLastUpdate(chart: ChartType) {
    let metricsToCheck: MetricTypesEnum[] = [];

    // Determine which metrics to check based on chart type
    switch (chart) {
      case ChartType.CostComparison:
        metricsToCheck = [MetricTypesEnum.DELEGATED_SUPPLY];
        break;
      case ChartType.AttackProfitability:
        metricsToCheck = [
          MetricTypesEnum.DELEGATED_SUPPLY,
          MetricTypesEnum.TREASURY,
        ];
        break;
      case ChartType.TokenDistribution:
        metricsToCheck = [
          MetricTypesEnum.DELEGATED_SUPPLY,
          MetricTypesEnum.CEX_SUPPLY,
          MetricTypesEnum.DEX_SUPPLY,
          MetricTypesEnum.LENDING_SUPPLY,
        ];
        break;
      default:
        break;
    }
    // Find the record with the greatest timestamp for the specified metrics
    const lastUpdate = await db.query.daoMetricsDayBucket.findFirst({
      columns: {
        date: true,
      },
      where: inArray(daoMetricsDayBucket.metricType, metricsToCheck),
      orderBy: (fields, { desc }) => [desc(fields.date)],
    });

    return lastUpdate?.date;
  }
}
