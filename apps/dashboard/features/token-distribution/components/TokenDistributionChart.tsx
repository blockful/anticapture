"use client";

import {
  CartesianGrid,
  Line,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Brush,
  ComposedChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/shared/components/ui/chart";
import { MetricSchema } from "@/features/token-distribution/utils/metrics";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { TokenDistributionCustomTooltip } from "@/features/token-distribution/components";
import { formatNumberUserReadable } from "@/shared/utils";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { timestampToReadableDate } from "@/shared/utils";
import React from "react";

interface TokenDistributionChartProps {
  appliedMetrics: string[];
  chartConfig: Record<string, MetricSchema>;
  chartData?: ChartDataSetPoint[];
  hoveredMetricKey?: string | null;
  isLoading?: boolean;
  error?: Error | null;
}

export const TokenDistributionChart = ({
  appliedMetrics,
  chartConfig,
  chartData,
  hoveredMetricKey,
  isLoading = false,
  error = null,
}: TokenDistributionChartProps) => {
  // 🎯 DYNAMIC SCALE DETECTION - Analyze data ranges for each metric
  const metricRanges = React.useMemo(() => {
    if (!chartData || !appliedMetrics.length) return {};

    const ranges: Record<string, { min: number; max: number; avg: number }> =
      {};

    appliedMetrics.forEach((metricKey) => {
      const values = chartData
        .map((item) => item[metricKey])
        .filter((v) => v !== undefined && v !== null && v > 0);

      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        ranges[metricKey] = { min, max, avg };
      }
    });

    return ranges;
  }, [chartData, appliedMetrics]);

  // Automatic axis assignment - group metrics by scale
  const axisAssignment = React.useMemo(() => {
    const ranges = Object.entries(metricRanges);

    if (ranges.length <= 1) {
      return { primary: appliedMetrics, secondary: [] };
    }

    const SCALE_THRESHOLD = 100;
    const maxValues = ranges.map(([key, range]) => ({ key, max: range.max }));
    const largestScale = Math.max(...maxValues.map((v) => v.max)) || 1;

    const primary: string[] = [];
    const secondary: string[] = [];

    ranges.forEach(([metricKey, range]) => {
      const scaleRatio = largestScale / range.max;
      if (scaleRatio > SCALE_THRESHOLD) {
        secondary.push(metricKey);
      } else {
        primary.push(metricKey);
      }
    });

    // Ensure at least one metric in primary
    if (primary.length === 0 && secondary.length > 0) {
      primary.push(secondary.pop()!);
    }

    return { primary, secondary };
  }, [metricRanges, appliedMetrics]);

  // Get axis ID for any metric
  const getAxisId = (metricKey: string): "primary" | "secondary" => {
    return axisAssignment.secondary.includes(metricKey)
      ? "secondary"
      : "primary";
  };

  // Show error state
  if (error) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="mb-2 text-red-500">
            <svg
              className="mx-auto h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">
            Failed to load chart data
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || !chartData) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!chartData.length) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <ResearchPendingChartBlur />
      </div>
    );
  }

  if (!appliedMetrics.length) return null;

  // Check if data is mocked (all metrics have 0 values)
  const isMocked = chartData.every((dataPoint) =>
    appliedMetrics.every(
      (metric) => !dataPoint[metric] || dataPoint[metric] === 0,
    ),
  );

  return (
    <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
      {isMocked && <ResearchPendingChartBlur />}
      <ChartContainer
        className="h-full w-full justify-start"
        config={chartConfig}
      >
        <ComposedChart data={chartData}>
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="date"
            type="number"
            domain={["auto", "auto"]}
            tickMargin={8}
            tickFormatter={(date) => timestampToReadableDate(date)}
          />
          {/* DEFAULT AXIS - Required for Recharts compatibility */}
          <YAxis yAxisId={0} hide domain={["auto", "auto"]} />

          {/* PRIMARY AXIS - For larger scale metrics */}
          <YAxis
            yAxisId="primary"
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatNumberUserReadable(Number(value))}
          />

          {/* SECONDARY AXIS - For smaller scale metrics (only when needed) */}
          {axisAssignment.secondary.length > 0 && (
            <YAxis
              yAxisId="secondary"
              orientation="right"
              domain={[0, "auto"]}
              tickFormatter={(value) => {
                // Dynamic formatter based on the metrics using this axis
                const isProposals = axisAssignment.secondary.includes(
                  "PROPOSALS_GOVERNANCE",
                );
                return isProposals
                  ? `${value}`
                  : formatNumberUserReadable(Number(value));
              }}
            />
          )}
          <Tooltip
            content={
              <TokenDistributionCustomTooltip chartConfig={chartConfig} />
            }
          />

          {/* Render LINE metrics - DYNAMIC AXIS ASSIGNMENT */}
          {appliedMetrics.map((metricKey) => {
            const isOpaque =
              hoveredMetricKey && !(metricKey === hoveredMetricKey);
            const config = chartConfig[metricKey];

            if (!config || config.type !== "LINE") {
              return null;
            }

            return (
              <Line
                key={`${metricKey}-line`}
                dataKey={metricKey}
                stroke={config.color}
                strokeWidth={2}
                strokeOpacity={isOpaque ? 0.3 : 1}
                dot={false}
                yAxisId={getAxisId(metricKey)}
              />
            );
          })}

          {/* Render SPORADIC_LINE metrics as event markers with dashed lines and arrows */}
          {appliedMetrics
            .filter(
              (metricKey) => chartConfig[metricKey]?.type === "SPORADIC_LINE",
            )
            .map((metricKey) => {
              const config = chartConfig[metricKey];
              const isOpaque =
                hoveredMetricKey && !(metricKey === hoveredMetricKey);

              // Get all dates where this metric has values > 0
              const eventDates =
                chartData?.filter((d) => d[metricKey] && d[metricKey] > 0) ||
                [];

              return eventDates.map((eventData, index) => (
                <ReferenceLine
                  key={`${metricKey}-event-${index}`}
                  x={eventData.date}
                  stroke={config.color}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={isOpaque ? 0.3 : 1}
                />
              ));
            })
            .flat()}

          {/* Render BARS for BAR type metrics */}
          {appliedMetrics.map((metricKey) => {
            const isOpaque =
              hoveredMetricKey && !(metricKey === hoveredMetricKey);
            const config = chartConfig[metricKey];

            if (!config || config.type !== "BAR") {
              return null;
            }

            return (
              <Bar
                key={`${metricKey}-bar`}
                dataKey={metricKey}
                fill={config.color}
                opacity={isOpaque ? 0.3 : 0.6}
                barSize={20}
                yAxisId={getAxisId(metricKey)}
              />
            );
          })}
          <Brush
            dataKey="date"
            height={32}
            stroke="#333"
            fill="#1f1f1f"
            tickFormatter={(timestamp) => timestampToReadableDate(timestamp)}
            travellerWidth={10}
          >
            <AreaChart height={32} width={1128} data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis yAxisId="brushAxis" hide />
              <Area
                type="monotone"
                dataKey={appliedMetrics[0]}
                stroke="#333"
                fill="#1f1f1f"
                fillOpacity={0.3}
                strokeWidth={1}
                dot={false}
                yAxisId="brushAxis"
              />
            </AreaChart>
          </Brush>
        </ComposedChart>
      </ChartContainer>
      <AnticaptureWatermark />
    </div>
  );
};
