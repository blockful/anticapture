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
import { BlankSlate } from "@/shared/components";
import { Inbox } from "lucide-react";

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
  // Get brush range from Zustand store
  const { brushRange } = useBrushStore();
  if (!chartData) return null;

  // Calculate visible data based on brush range
  const visibleData = chartData.slice(
    brushRange.startIndex,
    brushRange.endIndex + 1,
  );

  // Use visible data if we have a valid range, otherwise use full chart data
  const dataToUse = visibleData.length > 0 ? visibleData : chartData;

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
          {Object.keys(appliedMetricsFormatted).length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center sm:min-h-[300px]">
              <BlankSlate
                variant="title"
                icon={Inbox}
                description="No metrics selected to show"
                className="h-full flex-1"
              />
            </div>
          ) : (
            Object.entries(appliedMetricsFormatted).map(
              ([category, metrics]) => (
                <div key={category} className="mb-4 flex flex-col gap-2">
                  <CardTitle className="!text-alternative-sm text-secondary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                    {category}
                  </CardTitle>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col">
                    {metrics.map((metric: MetricWithKey) => {
                      const metricData = dataToUse
                        .map(
                          (point) =>
                            point[metric.key as keyof ChartDataSetPoint],
                        )
                        .filter((val) => val !== undefined);

                      if (metricData.length === 0) {
                        return null;
                      }

                      let currentValue: number | string | undefined;
                      let previousValue: number | string | undefined;

                      if (metric.key === "PROPOSALS_GOVERNANCE") {
                        // For proposals, count actual proposals in the visible data range
                        // Count all the proposal titles (strings) in the data
                        currentValue = metricData.reduce((sum: number, val) => {
                          // If val is a non-empty string, it means there's a proposal at that timestamp
                          return (
                            sum +
                            (val && typeof val === "string" && val.length > 0
                              ? 1
                              : 0)
                          );
                        }, 0);
                        previousValue = 0; // Base comparison
                      } else {
                        // For other metrics, use last and first values as before
                        currentValue = metricData[metricData.length - 1];
                        previousValue = metricData[0];
                      }

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

                      // Format variation - hide when 0
                      const formattedVariation =
                        Math.abs(variation) < 0.1 // Consider values less than 0.1% as zero
                          ? "" // Empty string when variation is essentially zero
                          : `${variation > 0 ? "+" : ""}${variation.toFixed(1)}`;

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
            )
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
