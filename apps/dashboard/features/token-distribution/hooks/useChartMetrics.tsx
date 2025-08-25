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

// Hook result interface
export interface UseChartMetricsResult {
  chartData: ChartDataSetPoint[];
  datasets: Record<string, ChartDataSetPoint[]>;
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

  // Create datasets organized by metric
  const datasets = useMemo(() => {
    const result: Record<string, ChartDataSetPoint[]> = {};

    // Process timeSeriesData (only for enum metrics)
    if (timeSeriesData) {
      enumMetrics.forEach((metricKey) => {
        const enumKey = metricKey as MetricTypesEnum;
        if (timeSeriesData[enumKey]) {
          result[metricKey] = timeSeriesData[enumKey].map(
            (item: DaoMetricsDayBucket) => ({
              date: Number(item.date),
              [metricKey]: Number(item.high) / 1e18, // Convert from wei to token units
            }),
          );
        }
      });
    }

    // Process historicalTokenData (token-price)
    if (appliedMetrics.includes("TOKEN_PRICE") && historicalTokenData?.prices) {
      result["TOKEN_PRICE"] = historicalTokenData.prices.map(
        ([timestamp, price]: [number, number]) => ({
          date: normalizeTimestamp(timestamp),
          TOKEN_PRICE: price,
        }),
      ) as ChartDataSetPoint[];
    }

    // Process proposalsOnChain (proposals count) - consolidate by date
    if (
      appliedMetrics.includes("PROPOSALS_GOVERNANCE") &&
      proposalsOnChain?.proposals
    ) {
      const proposalCounts = new Map<number, number>();

      proposalsOnChain.proposals.forEach((proposal) => {
        if (!proposal) return;
        const timestamp = normalizeTimestamp(proposal.timestamp);
        proposalCounts.set(timestamp, (proposalCounts.get(timestamp) || 0) + 1);
      });

      result["PROPOSALS_GOVERNANCE"] = Array.from(proposalCounts.entries()).map(
        ([timestamp, count]) => ({
          date: timestamp,
          PROPOSALS_GOVERNANCE: count,
        }),
      ) as ChartDataSetPoint[];
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
  const chartData = useMemo(() => {
    if (!appliedMetrics.length) return [];

    // 📅 COLETA DE TODOS OS TIMESTAMPS ÚNICOS
    // Junta todas as datas de todas as métricas aplicadas
    // Isso garante que o gráfico tenha pontos para todos os momentos relevantes
    const allUniqueDates = new Set<number>();

    appliedMetrics.forEach((metricKey) => {
      const dataset = datasets[metricKey];
      if (dataset && Array.isArray(dataset)) {
        dataset.forEach((item) => {
          allUniqueDates.add(item.date);
        });
      }
    });

    // 🔄 PREENCHIMENTO DE LACUNAS NOS DADOS
    // Para métricas contínuas: mantém último valor conhecido (forward-fill)
    // Para métricas esporádicas (proposals): usa 0 quando não há dados
    const lastKnownValues: Record<string, number> = {};
    const result: Record<string, number>[] = [];

    // Ordena todas as datas e cria pontos consolidados
    Array.from(allUniqueDates)
      .sort((a, b) => a - b) // Cronológico crescente
      .forEach((date) => {
        const dataPoint: Record<string, number> = { date };

        appliedMetrics.forEach((metricKey) => {
          const dataset = datasets[metricKey];
          const exactMatch = dataset?.find((d) => d.date === date);

          if (exactMatch && exactMatch[metricKey] != null) {
            dataPoint[metricKey] = exactMatch[metricKey];
            // Update last known value for continuous metrics
            if (metricKey !== "PROPOSALS_GOVERNANCE") {
              lastKnownValues[metricKey] = exactMatch[metricKey];
            }
          } else {
            // For sporadic metrics, use 0; for continuous metrics, use last known value
            dataPoint[metricKey] =
              metricKey === "PROPOSALS_GOVERNANCE"
                ? 0
                : (lastKnownValues[metricKey] ?? 0);
          }
        });

        result.push(dataPoint);
      });

    return result as ChartDataSetPoint[];
  }, [appliedMetrics, datasets]);

  // Determine loading and error states
  const isLoading = timeSeriesLoading || historicalLoading || proposalsLoading;
  const error = timeSeriesError || historicalError || proposalsError || null;

  // Handle error cases
  if (error) {
    console.error("useChartMetrics: Data fetching error", error);
  }

  return {
    chartData,
    datasets,
    chartConfig,
    isLoading,
    error,
  };
};
