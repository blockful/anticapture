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
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { BlankSlate, TooltipInfo } from "@/shared/components";
import { Inbox } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";

interface TokenDistributionMetricsProps {
  daoId: DaoIdEnum;
  appliedMetrics: (MetricTypesEnum | string)[];
  setAppliedMetrics: (metrics: string[]) => void;
  setHoveredMetricKey: (metricKey: string | null) => void;
  chartData?: ChartDataSetPoint[];
  context?: "overview" | "section";
}

export const TokenDistributionMetrics = ({
  daoId,
  appliedMetrics,
  setAppliedMetrics,
  setHoveredMetricKey,
  chartData,
  context = "section",
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
    <div className="flex h-full w-full flex-col justify-between gap-2 xl:gap-4">
      <div className="flex h-full w-full flex-col gap-4 xl:gap-6">
        <div className="scrollbar-none hover:scrollbar-thin gap-2 overflow-y-auto overflow-x-hidden xl:flex xl:max-h-[310px] xl:flex-col">
          {Object.keys(appliedMetricsFormatted).length === 0 ? (
            <>
              <div className="hidden w-full flex-col items-center justify-center xl:flex xl:min-h-[300px]">
                <BlankSlate
                  variant="small"
                  icon={Inbox}
                  description="No metrics selected to show"
                  className="h-full flex-1"
                />
              </div>
              <div className="flex w-full flex-col items-center justify-center xl:hidden">
                <BlankSlate
                  variant="small"
                  icon={Inbox}
                  description="No metrics selected to show"
                  className="h-full flex-1"
                />
              </div>
            </>
          ) : (
            Object.entries(appliedMetricsFormatted).map(
              ([category, metrics]) => {
                // Define tooltip text for each category
                const getTooltipText = (category: string) => {
                  switch (category) {
                    case "SUPPLY":
                      return "Next to each supply you'll see the latest value from the selected timeframe, along with the % change between its first and last points.";
                    case "VOLUME":
                      return "Total weekly transaction volume.";
                    case "GOVERNANCE":
                      return "Displays proposal count for the selected period, and the treasury's latest value and its % change over that timeframe.";
                    case "MARKET":
                      return "Next to the metric you'll see the latest value from the selected timeframe, along with the % change between its first and last points.";
                    default:
                      return "";
                  }
                };

                const tooltipText = getTooltipText(category);

                return (
                  <div
                    key={category}
                    className={cn("flex flex-col gap-2", {
                      "mb-4": context === "section",
                    })}
                  >
                    {context !== "overview" && (
                      <CardTitle className="flex items-center gap-2">
                        <p className="!text-alternative-sm text-secondary font-mono font-medium uppercase tracking-wide">
                          {category}
                        </p>
                        {category !== "GOVERNANCE" && category !== "MARKET" && (
                          <p className="!text-alternative-sm text-secondary font-mono font-medium uppercase tracking-wide">
                            ({daoId})
                          </p>
                        )}
                        {tooltipText && (
                          <TooltipInfo
                            text={tooltipText}
                            className="text-secondary"
                          />
                        )}
                      </CardTitle>
                    )}
                    <div
                      className={cn("gap-3", {
                        "grid grid-cols-2 xl:flex xl:flex-col":
                          context === "section",
                        "flex h-min": context === "overview",
                      })}
                    >
                      {metrics.map((metric: MetricWithKey) => {
                        const metricData = dataToUse
                          .map(
                            (point) =>
                              point[metric.key as keyof ChartDataSetPoint],
                          )
                          .filter((val) => val !== undefined);

                        // Always render the metric, even if no data - show as undefined
                        // if (metricData.length === 0) {
                        //   return null;
                        // }

                        let currentValue: number | string | undefined;
                        let previousValue: number | string | undefined;

                        if (metricData.length === 0) {
                          // No data available - show as undefined
                          currentValue = undefined;
                          previousValue = undefined;
                        } else if (metric.key === "PROPOSALS_GOVERNANCE") {
                          // For proposals, count actual proposals in the visible data range
                          // Count all the proposal titles (strings) in the data
                          currentValue = metricData.reduce(
                            (sum: number, val) => {
                              // If val is a non-empty string, it means there's a proposal at that timestamp
                              return (
                                sum +
                                (val &&
                                typeof val === "string" &&
                                val.length > 0
                                  ? 1
                                  : 0)
                              );
                            },
                            0,
                          );
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

                        // Hide amount and variation for VOLUME category metrics
                        const isVolumeMetric = metric.category === "VOLUME";

                        // Format value based on metric type
                        let formattedMetricsValue: string;
                        const metricKey = metric.key as string;

                        if (currentValue === undefined) {
                          formattedMetricsValue = ""; // Show "No data" when undefined
                        } else if (isVolumeMetric) {
                          formattedMetricsValue = ""; // No amount for volume metrics
                        } else if (metricKey === "TOKEN_PRICE") {
                          formattedMetricsValue = `$${Number(currentValue).toFixed(2)}`;
                        } else if (metricKey === "PROPOSALS_GOVERNANCE") {
                          formattedMetricsValue = formatNumberUserReadable(
                            Number(currentValue) || 0,
                          );
                        } else if (metricKey === "TREASURY") {
                          const numericValue = Number(currentValue);
                          formattedMetricsValue = `${formatNumberUserReadable(
                            Number.isFinite(numericValue)
                              ? Math.floor(numericValue)
                              : 0,
                          )} ${daoId}`;
                        } else {
                          const numericValue = Number(currentValue);
                          formattedMetricsValue = formatNumberUserReadable(
                            Number.isFinite(numericValue)
                              ? Math.floor(numericValue)
                              : 0,
                          );
                        }

                        // Format variation - hide for volume metrics, when 0, or when no data
                        const formattedVariation =
                          isVolumeMetric || currentValue === undefined
                            ? "" // No variation for volume metrics or when no data
                            : Math.abs(variation) < 0.1 // Consider values less than 0.1% as zero
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
                            context={context}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              },
            )
          )}
        </div>
      </div>
      {context === "section" && (
        <TokenDistributionDialog
          appliedMetrics={appliedMetricsFormatted}
          metricsSchema={metricsSchemaFormatted}
          onApply={handleApplyMetric}
        />
      )}
    </div>
  );
};
