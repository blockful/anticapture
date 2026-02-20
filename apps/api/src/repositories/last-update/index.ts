import { Drizzle, daoMetricsDayBucket } from "@/database";
import { inArray } from "drizzle-orm";

import { ChartType } from "@/mappers/";
import { MetricTypesEnum } from "@/lib/constants";

export interface LastUpdateRepository {
  getLastUpdate(chart: ChartType): Promise<bigint | undefined>;
}

export class LastUpdateRepositoryImpl implements LastUpdateRepository {
  constructor(private readonly db: Drizzle) {}

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
    const lastUpdate = await this.db.query.daoMetricsDayBucket.findFirst({
      columns: {
        lastUpdate: true,
      },
      where: inArray(daoMetricsDayBucket.metricType, metricsToCheck),
      orderBy: (fields, { desc }) => [desc(fields.lastUpdate)],
    });

    return lastUpdate?.lastUpdate;
  }
}
