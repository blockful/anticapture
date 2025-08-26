import { useMemo } from "react";
import { useTimeSeriesData } from "@/shared/hooks";
import { useDaoTokenHistoricalData } from "@/features/attack-profitability/hooks/useDaoTokenHistoricalData";
import { useProposals } from "@/features/token-distribution/hooks/useProposals";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { MetricSchema } from "@/features/token-distribution/utils/metrics";
import { normalizeTimestamp } from "@/features/token-distribution/utils/chart";

export interface UseChartMetricsResult {
  chartData: ChartDataSetPoint[];
  chartConfig: Record<string, MetricSchema>;
  isLoading: boolean;
}

export const useChartMetrics = ({
  appliedMetrics,
  daoId,
  metricsSchema,
}: {
  appliedMetrics: string[];
  daoId: DaoIdEnum;
  metricsSchema: Record<string, MetricSchema>;
}): UseChartMetricsResult => {
  // Get direct enum metrics
  const enumMetrics = appliedMetrics.filter((key) =>
    Object.values(MetricTypesEnum).includes(key as MetricTypesEnum),
  );

  // Get additional SUPPLY metrics needed for TRANSFER VOLUME metrics
  const transferVolumeMetrics = appliedMetrics.filter(
    (key) => metricsSchema[key]?.category === "TRANSFER VOLUME",
  );

  const additionalSupplyMetrics: MetricTypesEnum[] = [];
  transferVolumeMetrics.forEach((metric) => {
    if (metric === "CEX_TOKENS")
      additionalSupplyMetrics.push(MetricTypesEnum.CEX_SUPPLY);
    if (metric === "DEX_TOKENS")
      additionalSupplyMetrics.push(MetricTypesEnum.DEX_SUPPLY);
    if (metric === "LENDING_TOKENS")
      additionalSupplyMetrics.push(MetricTypesEnum.LENDING_SUPPLY);
    if (metric === "DELEGATIONS")
      additionalSupplyMetrics.push(MetricTypesEnum.DELEGATED_SUPPLY);
  });

  // Combine all metrics to fetch, removing duplicates
  const allMetricsToFetch = [
    ...new Set([
      ...(enumMetrics as MetricTypesEnum[]),
      ...additionalSupplyMetrics,
    ]),
  ];

  const shouldFetchTimeSeries = allMetricsToFetch.length > 0;

  // Fetch time series data (for all needed metrics)
  const { data: timeSeriesData, isLoading: timeSeriesLoading } =
    useTimeSeriesData(
      daoId,
      shouldFetchTimeSeries ? allMetricsToFetch : [],
      TimeInterval.ONE_YEAR,
      {
        refreshInterval: 300000,
        revalidateOnFocus: false,
      },
    );

  // Fetch historical token data (for token-price metric)
  const { data: historicalTokenData, loading: historicalLoading } =
    useDaoTokenHistoricalData(daoId);

  // Fetch proposals data (for proposals metric)
  const { data: proposalsOnChain, loading: proposalsLoading } =
    useProposals(daoId);

  // Create chart configuration from provided metricsSchema
  const chartConfig = useMemo(() => {
    return appliedMetrics.reduce(
      (acc, metricKey) => {
        const metric = metricsSchema[metricKey];
        if (metric) {
          acc[metricKey] = {
            label: metric.label,
            color: metric.color,
            category: metric.category,
            type: metric.type,
            axis: metric.axis,
          };
        }
        return acc;
      },
      {} as Record<string, MetricSchema>,
    );
  }, [appliedMetrics, metricsSchema]);

  // Create datasets organized by metric
  const datasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint> = {};

    // Process timeSeriesData (only for enum metrics)
    if (timeSeriesData) {
      console.log("timeSeriesData available:", Object.keys(timeSeriesData));
      console.log("enumMetrics:", enumMetrics);

      appliedMetrics.forEach((metricKey) => {
        const metricSchema = metricsSchema[metricKey];
        let dataSourceKey = metricKey as MetricTypesEnum;
        let valueField = "high";

        // For TRANSFER VOLUME metrics, use corresponding SUPPLY data with volume field
        if (metricSchema?.category === "TRANSFER VOLUME") {
          console.log(`Processing TRANSFER VOLUME metric: ${metricKey}`);
          if (metricKey === "CEX_TOKENS") {
            dataSourceKey = MetricTypesEnum.CEX_SUPPLY;
            valueField = "volume";
          } else if (metricKey === "DEX_TOKENS") {
            dataSourceKey = MetricTypesEnum.DEX_SUPPLY;
            valueField = "volume";
          } else if (metricKey === "LENDING_TOKENS") {
            dataSourceKey = MetricTypesEnum.LENDING_SUPPLY;
            valueField = "volume";
          } else if (metricKey === "DELEGATIONS") {
            dataSourceKey = MetricTypesEnum.DELEGATED_SUPPLY;
            valueField = "volume";
          }
          console.log(
            `Using dataSourceKey: ${dataSourceKey}, valueField: ${valueField}`,
          );
        }

        if (timeSeriesData[dataSourceKey]) {
          console.log(
            `Found data for ${dataSourceKey}, processing ${timeSeriesData[dataSourceKey].length} items`,
          );
          timeSeriesData[dataSourceKey].forEach((item: DaoMetricsDayBucket) => {
            const value = valueField === "volume" ? item.volume : item.high;
            console.log(`Item for ${metricKey}:`, {
              date: item.date,
              [valueField]: value,
            });
            result[item.date] = {
              ...result[item.date],
              date: Number(item.date),
              [metricKey]: Number(value) / 1e18, // Convert from wei to token units
            };
          });
        } else {
          console.log(`No data found for dataSourceKey: ${dataSourceKey}`);
        }
      });
    }

    // Process historicalTokenData (token-price)
    if (appliedMetrics.includes("TOKEN_PRICE") && historicalTokenData?.prices) {
      historicalTokenData.prices.forEach(
        ([timestamp, price]: [number, number]) => {
          result[normalizeTimestamp(timestamp)] = {
            ...result[normalizeTimestamp(timestamp)],
            date: normalizeTimestamp(timestamp),
            TOKEN_PRICE: price,
          };
        },
      );
    }

    if (
      appliedMetrics.includes("PROPOSALS_GOVERNANCE") &&
      proposalsOnChain?.proposals
    ) {
      proposalsOnChain.proposals.forEach((proposal) => {
        if (!proposal) return;
        const timestamp = normalizeTimestamp(proposal.timestamp);
        result[timestamp] = {
          ...result[timestamp],
          date: timestamp,
          PROPOSALS_GOVERNANCE: proposal.id,
        };
      });
    }

    return result;
  }, [
    appliedMetrics,
    timeSeriesData,
    historicalTokenData,
    proposalsOnChain,
    enumMetrics,
  ]);

  // Unified chart data
  const chartData = Object.values(datasets).map((value) => {
    const lastKnownValues: Record<
      keyof typeof metricsSchema,
      number | undefined
    > = {};

    return {
      ...Object.entries(value).reduce(
        (
          acc,
          [key, metric]: [
            keyof typeof metricsSchema,
            number | undefined | string,
          ],
        ) => {
          if (metric !== undefined) {
            lastKnownValues[key as keyof typeof metricsSchema] =
              metric as number;
          }
          if (key === "PROPOSALS_GOVERNANCE") {
            return {
              ...acc,
              [key]: metric ?? 0,
            };
          }
          return {
            ...acc,
            [key]: metric ?? lastKnownValues[key as keyof typeof metricsSchema],
          };
        },
        {} as ChartDataSetPoint,
      ),
    };
  });

  return {
    chartData,
    chartConfig,
    isLoading: timeSeriesLoading || historicalLoading || proposalsLoading,
  };
};
