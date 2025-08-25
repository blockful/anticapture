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
} from "recharts";
import { ChartContainer } from "@/shared/components/ui/chart";
import { timestampToReadableDate } from "@/shared/utils";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { TokenDistributionCustomTooltip } from "@/features/token-distribution/components";
import { formatNumberUserReadable } from "@/shared/utils";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { MetricSchema } from "@/features/token-distribution/utils/metrics";
import React from "react";

interface TokenDistributionChartProps {
  appliedMetrics: string[];
  chartConfig: Record<string, MetricSchema>;
  chartData?: ChartDataSetPoint[];
  hoveredMetricKey?: string | null;
}

export const TokenDistributionChart = ({
  appliedMetrics,
  chartConfig,
  chartData,
  hoveredMetricKey,
}: TokenDistributionChartProps) => {
  // Show loading state
  if (!chartData) {
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

  // appliedMetrics.forEach((metricKey) => {
  //   const config = chartConfig[metricKey];
  // });

  // if (chartData.length > 0) {
  //   const firstDataPoint = chartData[0];

  //   // Verificar se as métricas aplicadas existem nos dados
  //   appliedMetrics.forEach((metricKey) => {
  //     const value = firstDataPoint[metricKey];
  //   });
  // }

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
            scale="time"
            type="number"
            domain={["auto", "auto"]}
            tickMargin={8}
            tickFormatter={(date) => timestampToReadableDate(date)}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatNumberUserReadable(Number(value))}
          />
          <Tooltip
            content={
              <TokenDistributionCustomTooltip chartConfig={chartConfig} />
            }
          />

          {/* Render all metrics as LINES first */}
          {appliedMetrics.map((metricKey) => {
            const isOpaque =
              hoveredMetricKey && !(metricKey === hoveredMetricKey);
            const config = chartConfig[metricKey];

            if (!config) {
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
              />
            );
          })}

          {/* Render BARS for BAR type metrics */}
          {appliedMetrics.map((metricKey) => {
            const config = chartConfig[metricKey];

            if (!config || config.type !== "BAR") {
              return null;
            }

            return (
              <Bar
                key={`${metricKey}-bar`}
                dataKey={metricKey}
                fill={config.color}
                opacity={0.6}
              />
            );
          })}
          <Brush
            dataKey="date"
            height={32}
            stroke="#333"
            fill="#1f1f1f"
            tickFormatter={(timestamp) => timestampToReadableDate(timestamp)}
          >
            <AreaChart height={32} width={1128} data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Bar
                dataKey={appliedMetrics[0]}
                fill={chartConfig[appliedMetrics[0]].color}
              />
              <Area
                type="monotone"
                dataKey={appliedMetrics[0]}
                stroke={chartConfig[appliedMetrics[0]].color}
                fill={chartConfig[appliedMetrics[0]].color}
                fillOpacity={0.3}
                strokeWidth={1}
                dot={false}
              />
            </AreaChart>
          </Brush>
        </ComposedChart>
      </ChartContainer>
      <AnticaptureWatermark />
    </div>
  );
};
