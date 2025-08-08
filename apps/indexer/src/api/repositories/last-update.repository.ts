import { db } from "ponder:api";
import { eq, or } from "ponder";
import { daoMetricsDayBucket } from "ponder:schema";

import { ChartType } from "../mappers/last-update";
import { MetricTypesEnum } from "@/lib/constants";

export class LastUpdateRepository {
  async getLastUpdate(chart: ChartType) {
    let metricsToCheck: MetricTypesEnum[];

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
        throw new Error(`Unsupported chart type: ${chart}`);
    }

    // Create where condition for the metrics
    const metricConditions = metricsToCheck.map((metric) =>
      eq(daoMetricsDayBucket.metricType, metric),
    );

    const whereCondition =
      metricConditions.length === 1
        ? metricConditions[0]
        : or(...metricConditions);

    // Find the record with the greatest timestamp for the specified metrics
    const lastUpdate = await db.query.daoMetricsDayBucket.findFirst({
      where: whereCondition,
      orderBy: (fields, { desc }) => [desc(fields.date)],
    });

    return lastUpdate?.date ?? null;
  }
}
