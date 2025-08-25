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

// Hook result interface
export interface UseChartMetricsResult {
  chartData: ChartDataSetPoint[];
  chartConfig: Record<string, MetricSchema>;
  isLoading: boolean;
  error: Error | null;
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
  // Only fetch timeSeriesData if we have enum metrics
  const enumMetrics = appliedMetrics.filter((key) =>
    Object.values(MetricTypesEnum).includes(key as MetricTypesEnum),
  );

  const shouldFetchTimeSeries = enumMetrics.length > 0;

  // Fetch time series data (only if we have enum metrics)
  const {
    data: timeSeriesData,
    error: timeSeriesError,
    isLoading: timeSeriesLoading,
  } = useTimeSeriesData(
    daoId,
    shouldFetchTimeSeries ? (enumMetrics as MetricTypesEnum[]) : [],
    TimeInterval.ONE_YEAR,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  // Fetch historical token data (for token-price metric)
  const {
    data: historicalTokenData,
    loading: historicalLoading,
    error: historicalError,
  } = useDaoTokenHistoricalData(daoId);

  // Fetch proposals data (for proposals metric)
  const {
    data: proposalsOnChain,
    loading: proposalsLoading,
    error: proposalsError,
  } = useProposals(daoId);

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
          };
        }
        return acc;
      },
      {} as Record<string, MetricSchema>,
    );
  }, [appliedMetrics, metricsSchema]);

  // Simplified data unification
  const chartData = useMemo(() => {
    if (!appliedMetrics.length) return [];

    // Collect all timestamps from all data sources
    const timestampMap = new Map<number, Partial<ChartDataSetPoint>>();

    // Process timeSeriesData (only for enum metrics)
    if (timeSeriesData) {
      enumMetrics.forEach((metricKey) => {
        const enumKey = metricKey as MetricTypesEnum;

        if (timeSeriesData[enumKey]) {
          timeSeriesData[enumKey].forEach((item: DaoMetricsDayBucket) => {
            const timestamp = Number(item.date);
            if (!timestampMap.has(timestamp)) {
              timestampMap.set(timestamp, { date: timestamp });
            }
            // Convert from wei to token units
            timestampMap.get(timestamp)![metricKey] = Number(item.high) / 1e18;
          });
        }
      });
    }

    // Process historicalTokenData (token-price)
    if (appliedMetrics.includes("TOKEN_PRICE") && historicalTokenData?.prices) {
      historicalTokenData.prices.forEach(
        ([timestamp, price]: [number, number]) => {
          const timestampSeconds = Math.floor(timestamp / 1000);
          if (!timestampMap.has(timestampSeconds)) {
            timestampMap.set(timestampSeconds, { date: timestampSeconds });
          }
          timestampMap.get(timestampSeconds)!["TOKEN_PRICE"] = price;
        },
      );
    }

    // Process proposalsOnChain (proposals count)
    if (
      appliedMetrics.includes("PROPOSALS_GOVERNANCE") &&
      proposalsOnChain?.proposals
    ) {
      proposalsOnChain.proposals.forEach((proposal) => {
        if (!proposal) return; // Skip null proposals

        const timestamp =
          Number(proposal.timestamp) > 1000000000000
            ? Math.floor(Number(proposal.timestamp) / 1000)
            : Number(proposal.timestamp);

        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, { date: timestamp });
        }
        // Count proposals at this timestamp
        const current =
          timestampMap.get(timestamp)!["PROPOSALS_GOVERNANCE"] || 0;
        timestampMap.get(timestamp)!["PROPOSALS_GOVERNANCE"] = current + 1;
      });
    }

    // Convert map to sorted array
    const result = Array.from(timestampMap.values()).sort(
      (a, b) => (a.date || 0) - (b.date || 0),
    );

    // Fill missing values with 0 for ALL metrics to ensure rendering
    const filledResult = result.map((dataPoint) => {
      const filledPoint = { ...dataPoint };
      appliedMetrics.forEach((metricKey) => {
        if (filledPoint[metricKey] === undefined) {
          // SEMPRE preencher com 0 para garantir que todas as métricas sejam renderizadas
          filledPoint[metricKey] = 0;
        }
      });
      return filledPoint as ChartDataSetPoint;
    });

    return filledResult;
  }, [appliedMetrics, timeSeriesData, historicalTokenData, proposalsOnChain]);

  // Determine loading and error states
  const isLoading = timeSeriesLoading || historicalLoading || proposalsLoading;
  const error = timeSeriesError || historicalError || proposalsError || null;

  return {
    chartData,
    chartConfig,
    isLoading,
    error,
  };
};
