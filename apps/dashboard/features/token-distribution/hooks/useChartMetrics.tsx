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
    useDaoTokenHistoricalData(daoId);

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
        if (metricSchema?.category === "TRANSFER VOLUME") {
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
        }

        if (timeSeriesData[dataSourceKey]) {
          timeSeriesData[dataSourceKey].forEach((item: DaoMetricsDayBucket) => {
            const value = valueField === "volume" ? item.volume : item.high;

            result[item.date] = {
              ...result[item.date],
              date: Number(item.date),
              [metricKey]: Number(value) / 1e18, // Convert from wei to token units
            };
          });
        }
      });
    }

    return result;
  }, [timeSeriesData, stableAppliedMetrics, metricsSchema]);

  // Process historical token data separately
  const tokenPriceDatasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint> = {};

    if (
      stableAppliedMetrics.includes("TOKEN_PRICE") &&
      filteredHistoricalTokenData?.prices
    ) {
      filteredHistoricalTokenData.prices.forEach(
        ([timestamp, price]: [number, number]) => {
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
      filteredProposals.proposals.forEach((proposal) => {
        // Only process proposals that have a valid ID
        if (!proposal || !proposal.id) return;

        const timestamp = normalizeTimestamp(proposal.timestamp);
        result[timestamp] = {
          ...result[timestamp],
          date: timestamp,
          PROPOSALS_GOVERNANCE: proposal.title ?? "",
        };
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
          result[key] = {
            ...result[key],
            ...value,
          };
        });
      },
    );

    return result;
  }, [timeSeriesDatasets, tokenPriceDatasets, proposalsDatasets]);

  // Group data by time periods for BAR metrics
  const groupDataByPeriod = (
    data: Record<string, ChartDataSetPoint>,
    interval: string,
  ) => {
    if (interval === "daily") {
      return data;
    }

    const grouped: Record<string, ChartDataSetPoint> = {};

    Object.values(data).forEach((point) => {
      const date = new Date(point.date * 1000);
      let groupKey: string;

      switch (interval) {
        case "weekly": {
          // Get start of week (Sunday)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          groupKey = Math.floor(startOfWeek.getTime() / 1000).toString();
          break;
        }
        case "monthly": {
          // Get start of month
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          groupKey = Math.floor(startOfMonth.getTime() / 1000).toString();
          break;
        }
        case "quarterly": {
          // Get start of quarter
          const quarter = Math.floor(date.getMonth() / 3);
          const startOfQuarter = new Date(date.getFullYear(), quarter * 3, 1);
          groupKey = Math.floor(startOfQuarter.getTime() / 1000).toString();
          break;
        }
        default:
          groupKey = point.date.toString();
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = { ...point, date: Number(groupKey) };
      } else {
        // Aggregate BAR metrics (sum them up)
        Object.entries(point).forEach(([key, value]) => {
          if (key === "date") return;
          const config = metricsSchema[key];
          if (config?.type === "BAR" && typeof value === "number") {
            grouped[groupKey][key] =
              ((grouped[groupKey][key] as number) || 0) + value;
          } else if (
            key === "PROPOSALS_GOVERNANCE" &&
            typeof value === "number"
          ) {
            grouped[groupKey][key] =
              ((grouped[groupKey][key] as number) || 0) + value;
          } else {
            // For other metrics (AREA, LINE), use latest value
            grouped[groupKey][key] = value;
          }
        });
      }
    });

    return grouped;
  };

  // Determine time interval based on data range
  const getTimeInterval = () => {
    const sortedDates = Object.keys(datasets).map(Number).sort();
    if (sortedDates.length === 0) return "daily";

    const timeRange = sortedDates[sortedDates.length - 1] - sortedDates[0];
    const days = timeRange / (24 * 60 * 60);

    if (days <= 90) return "daily"; // ≤3mo: Daily
    if (days <= 365) return "weekly"; // ≤1yr: Weekly
    if (days <= 730) return "monthly"; // ≤2yr: Monthly
    return "quarterly"; // >2yr: Quarterly
  };

  const timeInterval = getTimeInterval();

  // Unified chart data with optimized processing
  const chartData = useMemo(() => {
    // If no metrics are applied, return empty array
    if (stableAppliedMetrics.length === 0) {
      return [];
    }

    const groupedDatasets = groupDataByPeriod(datasets, timeInterval);

    return Object.values(groupedDatasets).map((value) => {
      const lastKnownValues: Record<
        keyof typeof metricsSchema,
        number | undefined
      > = {};

      const processedPoint = {
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
              [key]:
                metric ?? lastKnownValues[key as keyof typeof metricsSchema],
            };
          },
          {} as ChartDataSetPoint,
        ),
      };

      // Ensure all applied metrics exist in every point (especially PROPOSALS_GOVERNANCE)
      stableAppliedMetrics.forEach((metricKey) => {
        if (!(metricKey in processedPoint)) {
          processedPoint[metricKey] =
            metricKey === "PROPOSALS_GOVERNANCE" ? 0 : undefined;
        }
      });

      return processedPoint;
    });
  }, [datasets, timeInterval, stableAppliedMetrics, metricsSchema]);

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
