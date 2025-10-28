import { useMemo } from "react";
import { useTimeSeriesData } from "@/shared/hooks";
import { useDaoTokenHistoricalData } from "@/features/attack-profitability/hooks/useDaoTokenHistoricalData";
import { useProposals } from "@/features/token-distribution/hooks/useProposals";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { DaoMetricsDayBucket, PriceEntry } from "@/shared/dao-config/types";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { MetricSchema } from "@/features/token-distribution/utils/metrics";
import { normalizeTimestamp } from "@/features/token-distribution/utils/chart";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";

export interface UseChartMetricsResult {
  chartData: ChartDataSetPoint[];
  chartConfig: Record<string, MetricSchema>;
  isLoading: boolean;
}

export const useChartMetrics = ({
  appliedMetrics,
  daoId,
  metricsSchema,
  tokenType,
}: {
  appliedMetrics: string[];
  daoId: DaoIdEnum;
  metricsSchema: Record<string, MetricSchema>;
  tokenType: "ERC20" | "ERC721";
}): UseChartMetricsResult => {
  // Get direct enum metrics
  const enumMetrics = appliedMetrics.filter((key) =>
    Object.values(MetricTypesEnum).includes(key as MetricTypesEnum),
  );

  // Get additional SUPPLY metrics needed for TRANSFER VOLUME metrics
  const transferVolumeMetrics = appliedMetrics.filter(
    (key) => metricsSchema[key]?.category === "VOLUME",
  );

  const additionalSupplyMetrics: MetricTypesEnum[] = [];
  transferVolumeMetrics.forEach((metric) => {
    if (metric === "CEX_TRANSFERS")
      additionalSupplyMetrics.push(MetricTypesEnum.CEX_SUPPLY);
    if (metric === "DEX_TRANSFERS")
      additionalSupplyMetrics.push(MetricTypesEnum.DEX_SUPPLY);
    if (metric === "LENDING_TRANSFERS")
      additionalSupplyMetrics.push(MetricTypesEnum.LENDING_SUPPLY);
    if (metric === "DELEGATIONS")
      additionalSupplyMetrics.push(MetricTypesEnum.DELEGATED_SUPPLY);
  });

  // Stable sort for applied metrics to prevent unnecessary recalculations
  const stableAppliedMetrics = useMemo(() => {
    return [...appliedMetrics].sort();
  }, [appliedMetrics]);

  // Combine all metrics to fetch, removing duplicates
  const allMetricsToFetch = [
    ...new Set([
      ...(enumMetrics as MetricTypesEnum[]),
      ...additionalSupplyMetrics,
    ]),
  ];

  const shouldFetchTimeSeries = allMetricsToFetch.length > 0;
  const shouldFetchTokenPrice = stableAppliedMetrics.includes("TOKEN_PRICE");
  const shouldFetchProposals = stableAppliedMetrics.includes(
    "PROPOSALS_GOVERNANCE",
  );

  //TODO: Create new fetch of the data to doesn't limit to one year, get all the time range.

  // Fetch time series data (for all needed metrics) - only when metrics are applied
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

  // Fetch historical token data (for token-price metric) - only when needed
  const { data: historicalTokenData, loading: historicalLoading } =
    useDaoTokenHistoricalData({ daoId });

  const oneYearAgo = useMemo(
    () =>
      Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[TimeInterval.ONE_YEAR],
    [],
  );

  // Fetch proposals data (for proposals metric) - only when needed
  const { data: proposals, loading: proposalsLoading } = useProposals(
    daoId,
    oneYearAgo,
  );

  // Apply conditional loading based on applied metrics
  const filteredHistoricalTokenData = shouldFetchTokenPrice
    ? historicalTokenData
    : null;
  const filteredProposals = shouldFetchProposals ? proposals : null;

  // Create chart configuration from provided metricsSchema
  const chartConfig = useMemo(() => {
    return stableAppliedMetrics.reduce(
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
  }, [stableAppliedMetrics, metricsSchema]);

  // Process time series data separately from other data sources for better caching
  const timeSeriesDatasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint> = {};

    if (timeSeriesData) {
      stableAppliedMetrics.forEach((metricKey) => {
        const metricSchema = metricsSchema[metricKey];
        let dataSourceKey = metricKey as MetricTypesEnum;
        let valueField = "high";

        // For TRANSFER VOLUME metrics, use corresponding SUPPLY data with volume field
        if (metricSchema?.category === "VOLUME") {
          if (metricKey === "CEX_TRANSFERS") {
            dataSourceKey = MetricTypesEnum.CEX_SUPPLY;
            valueField = "volume";
          } else if (metricKey === "DEX_TRANSFERS") {
            dataSourceKey = MetricTypesEnum.DEX_SUPPLY;
            valueField = "volume";
          } else if (metricKey === "LENDING_TRANSFERS") {
            dataSourceKey = MetricTypesEnum.LENDING_SUPPLY;
            valueField = "volume";
          } else if (metricKey === "DELEGATIONS") {
            dataSourceKey = MetricTypesEnum.DELEGATED_SUPPLY;
            valueField = "volume";
          }
        }

        if (timeSeriesData[dataSourceKey]) {
          timeSeriesData[dataSourceKey].forEach((item: DaoMetricsDayBucket) => {
            const value = valueField === "volume" ? item.volume : item.high;

            result[normalizeTimestamp(item.date)] = {
              ...result[normalizeTimestamp(item.date)],
              date: normalizeTimestamp(item.date),
              [metricKey]:
                tokenType === "ERC721" ? Number(value) : Number(value) / 1e18, // Convert from wei to token units
            };
          });
        }
      });
    }

    return result;
  }, [timeSeriesData, stableAppliedMetrics, metricsSchema, tokenType]);

  // Process historical token data separately
  const tokenPriceDatasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint> = {};

    if (
      stableAppliedMetrics.includes("TOKEN_PRICE") &&
      filteredHistoricalTokenData
    ) {
      filteredHistoricalTokenData.forEach(
        ({ timestamp, price }: PriceEntry) => {
          result[normalizeTimestamp(timestamp)] = {
            ...result[normalizeTimestamp(timestamp)],
            date: normalizeTimestamp(timestamp),
            TOKEN_PRICE: price,
          };
        },
      );
    }

    return result;
  }, [stableAppliedMetrics, filteredHistoricalTokenData]);

  // Process proposals data separately
  const proposalsDatasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint> = {};

    if (
      stableAppliedMetrics.includes("PROPOSALS_GOVERNANCE") &&
      filteredProposals?.proposals
    ) {
      filteredProposals.proposals.items.forEach((proposal) => {
        // Only process proposals that have a valid ID
        if (!proposal || !proposal.id) return;

        const timestamp = normalizeTimestamp(proposal.timestamp);

        result[normalizeTimestamp(timestamp)] = {
          ...result[normalizeTimestamp(timestamp)],
          date: normalizeTimestamp(timestamp),
          PROPOSALS_GOVERNANCE: 1,
          PROPOSALS_GOVERNANCE_TEXT: proposal.title || "",
        };
        // }
      });
    }

    return result;
  }, [stableAppliedMetrics, filteredProposals]);

  // Combine all datasets
  const datasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint> = {};

    // Merge all dataset sources
    [timeSeriesDatasets, tokenPriceDatasets, proposalsDatasets].forEach(
      (dataset) => {
        Object.entries(dataset).forEach(([key, value]) => {
          if (!result[key]) {
            result[key] = value;
          } else {
            Object.entries(value).forEach(([k, v]) => {
              if (result[key][k] === undefined) {
                result[key][k] = v;
              }
            });
          }
        });
      },
    );

    return result;
  }, [timeSeriesDatasets, tokenPriceDatasets, proposalsDatasets]);

  // Unified chart data with optimized processing
  const chartData = useMemo(() => {
    // If no metrics are applied, return empty array
    if (stableAppliedMetrics.length === 0) {
      return [];
    }

    const sortedData = Object.values(datasets).sort((a, b) => a.date - b.date);

    const lastKnownValues: Partial<ChartDataSetPoint> = {};

    return sortedData.map((point) => {
      const processedPoint: ChartDataSetPoint = { date: point.date };

      stableAppliedMetrics.forEach((metricKey) => {
        const config = metricsSchema[metricKey];
        const value = point[metricKey];
        if (value !== undefined) {
          processedPoint[metricKey] = value;
          if (config?.type === "LINE" || config?.type === "AREA") {
            lastKnownValues[metricKey] = value;
          }
        } else {
          if (config?.type === "LINE" || config?.type === "AREA") {
            processedPoint[metricKey] = lastKnownValues[metricKey];
          } else {
            processedPoint[metricKey] = 0;
          }
        }
      });

      Object.entries(point).forEach(([key, value]) => {
        if (!processedPoint[key]) {
          processedPoint[key] = value;
        }
      });

      return processedPoint;
    });
  }, [stableAppliedMetrics, datasets, metricsSchema]);

  // Optimized loading state - only consider loading for applied metrics
  const isLoadingOptimized = useMemo(() => {
    let loading = false;

    // Only consider time series loading if we're fetching time series data
    if (shouldFetchTimeSeries && timeSeriesLoading) {
      loading = true;
    }

    // Only consider token price loading if we need token price
    if (shouldFetchTokenPrice && historicalLoading) {
      loading = true;
    }

    // Only consider proposals loading if we need proposals
    if (shouldFetchProposals && proposalsLoading) {
      loading = true;
    }

    return loading;
  }, [
    shouldFetchTimeSeries,
    timeSeriesLoading,
    shouldFetchTokenPrice,
    historicalLoading,
    shouldFetchProposals,
    proposalsLoading,
  ]);

  return {
    chartData,
    chartConfig,
    isLoading: isLoadingOptimized,
  };
};
