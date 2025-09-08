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
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import { formatNumberUserReadable } from "@/shared/utils";

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
  // Get visible data from Zustand store (filtered by brush)
  const { visibleData } = useBrushStore();
  if (!chartData) return null;

  // Use visible data if available AND it has all the same keys as chartData
  // Otherwise fallback to full chart data
  const chartDataKeys = chartData[0] ? Object.keys(chartData[0]) : [];
  const visibleDataKeys = visibleData[0] ? Object.keys(visibleData[0]) : [];
  const hasAllKeys = chartDataKeys.every((key) =>
    visibleDataKeys.includes(key),
  );

  const dataToUse =
    visibleData.length > 0 && hasAllKeys ? visibleData : chartData;

  const handleApplyMetric = (newMetrics: (MetricTypesEnum | string)[]) => {
    // Add new metrics to existing ones (do not replace)
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
      .map((key) => [key, metricsSchema[key as keyof typeof metricsSchema]])
      .filter(([, metric]) => !!metric),
  ) as Record<string, MetricSchema>;

  const appliedMetricsFormatted = formatMetricsByCategory(appliedMetricsSchema);
  const metricsSchemaFormatted = formatMetricsByCategory(metricsSchema);

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex h-full w-full flex-col gap-4 sm:gap-6">
        <div className="scrollbar-none contents max-h-96 gap-2 overflow-y-auto sm:flex sm:flex-col">
          {Object.entries(appliedMetricsFormatted).map(
            ([category, metrics]) => (
              <div key={category} className="mb-4 flex flex-col gap-2">
                <CardTitle className="!text-alternative-sm text-secondary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                  {category}
                </CardTitle>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col">
                  {metrics.map((metric: MetricWithKey) => {
                    const metricData = dataToUse
                      .map(
                        (point) => point[metric.key as keyof ChartDataSetPoint],
                      )
                      .filter((val) => val !== undefined);

                    if (metricData.length === 0) {
                      return null;
                    }

                    // Actual value: last point with data
                    const currentValue = metricData[metricData.length - 1];

                    // Previous value: first point with data
                    const previousValue = metricData[0];

                    // Calculate percentage variation
                    const variation =
                      previousValue && currentValue
                        ? ((Number(currentValue) - Number(previousValue)) /
                            Number(previousValue)) *
                          100
                        : 0;

                    // Format value based on metric type
                    let formattedMetricsValue: string;
                    const metricKey = metric.key as string;

                    if (metricKey === "TOKEN_PRICE") {
                      formattedMetricsValue = `$${Number(currentValue).toFixed(2)}`;
                    } else if (metricKey === "PROPOSALS_GOVERNANCE") {
                      formattedMetricsValue = formatNumberUserReadable(
                        Number(currentValue) || 0,
                      );
                    } else {
                      const numericValue = Number(currentValue);
                      formattedMetricsValue = formatNumberUserReadable(
                        Number.isFinite(numericValue)
                          ? Math.floor(numericValue)
                          : 0,
                      );
                    }

                    // Format variation
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
