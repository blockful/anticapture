"use client";

import { CardTitle } from "@/shared/components/ui/card";
import { TokenDistributionDialog } from "@/features/token-distribution/components";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import {
  formatMetricsByCategory,
  MetricSchema,
  metricsSchema,
} from "@/features/token-distribution/utils/metrics";
import { Metric } from "@/features/token-distribution/components/Metric";
import { MetricWithKey } from "@/features/token-distribution/types";

interface TokenDistributionMetricsProps {
  appliedMetrics: (MetricTypesEnum | string)[];
  setAppliedMetrics: (metrics: string[]) => void;
  setHoveredMetricKey: (metricKey: string | null) => void;
  chartData?: ChartDataSetPoint[];
}

export const TokenDistributionMetrics = ({
  appliedMetrics,
  setAppliedMetrics,
  setHoveredMetricKey,
  chartData,
}: TokenDistributionMetricsProps) => {
  if (!chartData) return null;

  // const metricsData = formatChartVariation(chartData);

  const handleApplyMetric = (newMetrics: (MetricTypesEnum | string)[]) => {
    // ADICIONAR novas métricas às existentes (não substituir)
    const updatedMetrics = [...appliedMetrics, ...newMetrics];
    setAppliedMetrics(updatedMetrics);
  };

  const handleRemoveMetric = (metricToRemove: MetricTypesEnum | string) => {
    setAppliedMetrics(
      appliedMetrics.filter((metric) => metric !== metricToRemove),
    );
    setHoveredMetricKey(null);
  };

  const appliedMetricsSchema = Object.fromEntries(
    appliedMetrics
      .map((key) => [key, metricsSchema[key]])
      .filter(([, metric]) => !!metric),
  ) as Record<string, MetricSchema>;

  const appliedMetricsFormatted = formatMetricsByCategory(appliedMetricsSchema);
  const metricsSchemaFormatted = formatMetricsByCategory(metricsSchema);

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex h-full w-full flex-col gap-4 sm:gap-6">
        <div className="scrollbar-none flex max-h-96 flex-col gap-2 overflow-y-auto">
          {Object.entries(appliedMetricsFormatted).map(
            ([category, metrics]) => (
              <div key={category} className="mb-4 flex flex-col gap-2">
                <CardTitle className="!text-alternative-sm text-secondary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                  {category}
                </CardTitle>
                {metrics.map((metric: MetricWithKey) => {
                  // CORREÇÃO SUPREMA: Calcular valores corretos das métricas
                  const metricData = chartData
                    .map((point) => point[metric.key])
                    .filter((val) => val !== undefined);

                  if (metricData.length === 0) {
                    console.warn(`No data found for metric: ${metric.key}`);
                    return null;
                  }

                  // Valor atual: último ponto com dados
                  const currentValue = metricData[metricData.length - 1];

                  // Valor anterior: primeiro ponto com dados
                  const previousValue = metricData[0];

                  // Calcular variação percentual
                  const variation =
                    previousValue && currentValue
                      ? ((currentValue - previousValue) / previousValue) * 100
                      : 0;

                  // Formatar valor baseado no tipo de métrica
                  let formattedMetricsValue: string;
                  const metricKey = metric.key as string; // Permitir métricas customizadas

                  if (metricKey === "TOKEN_PRICE") {
                    // Token price já está em formato correto
                    formattedMetricsValue = currentValue?.toFixed(2) || "0";
                  } else if (metricKey === "PROPOSALS_GOVERNANCE") {
                    // Proposals são contagem, não precisam de formatação wei
                    formattedMetricsValue = currentValue?.toString() || "0";
                  } else {
                    // Métricas de supply: converter de wei para token units
                    formattedMetricsValue = currentValue
                      ? (Number(currentValue) / 1e18).toFixed(2)
                      : "0";
                  }

                  // Formatar variação
                  const formattedVariation =
                    variation !== 0
                      ? `${variation > 0 ? "+" : ""}${variation.toFixed(1)}`
                      : "0.0";

                  const handleClick = () => {
                    const metricKey = appliedMetrics.find(
                      (key) => key === metric.key,
                    );
                    if (metricKey) handleRemoveMetric(metricKey);
                  };

                  const handleMouseEnter = () => {
                    const hoveredKey = appliedMetrics.find(
                      (key) => key === metric.key,
                    );
                    setHoveredMetricKey(hoveredKey ?? null);
                  };

                  const handleMouseLeave = () => {
                    setHoveredMetricKey(null);
                  };

                  return (
                    <Metric
                      key={metric.key}
                      label={metric.label}
                      color={metric.color}
                      value={formattedMetricsValue}
                      percentage={formattedVariation}
                      onRemove={handleClick}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
            ),
          )}
        </div>
      </div>
      <TokenDistributionDialog
        appliedMetrics={appliedMetricsFormatted}
        metricsSchema={metricsSchemaFormatted}
        onApply={handleApplyMetric}
      />
    </div>
  );
};
