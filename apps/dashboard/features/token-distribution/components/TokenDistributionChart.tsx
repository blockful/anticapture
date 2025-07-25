"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Brush,
} from "recharts";
import { ChartContainer } from "@/shared/components/ui/chart";
import { timestampToReadableDate } from "@/shared/utils";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { TokenDistributionCustomTooltip } from "@/features/token-distribution/components";
import { formatNumberUserReadable } from "@/shared/utils";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";

interface TokenDistributionChartProps {
  appliedMetrics: MetricTypesEnum[];
  chartConfig: Record<string, { label: string; color: string }>;
  timeSeriesData?: Record<MetricTypesEnum, DaoMetricsDayBucket[]> | null;
  hoveredMetricKey?: string | null;
}

export const TokenDistributionChart = ({
  timeSeriesData,
  appliedMetrics,
  chartConfig,
  hoveredMetricKey,
}: TokenDistributionChartProps) => {
  if (!timeSeriesData) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <ResearchPendingChartBlur />;
      </div>
    );
  }

  const datasets = appliedMetrics.reduce(
    (acc, key) => {
      acc[key] = timeSeriesData[key];
      return acc;
    },
    {} as Record<MetricTypesEnum, DaoMetricsDayBucket[]>,
  );

  const allDates = new Set(
    Object.values(datasets).flatMap((dataset) =>
      dataset?.map((item) => item.date),
    ),
  );

  const chartData = Array.from(allDates)
    .sort((a, b) => Number(a) - Number(b))
    .map((date) => {
      const dataPoint: Record<string, number | null> = {
        date: Number(date),
      };

      Object.keys(datasets).forEach((key) => {
        const entry = datasets[key as keyof typeof datasets]?.find(
          (item) => item.date === date,
        );
        dataPoint[key] = entry ? Number(entry.high) / 1e18 : null;
      });

      return dataPoint;
    })
    .filter(
      (dataPoint) => !Object.values(dataPoint).some((value) => value == null),
    );

  const isMocked = Object.values(datasets).every(
    (value) => value!.length === 0,
  );

  return (
    <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
      {isMocked && <ResearchPendingChartBlur />}
      <ChartContainer
        className="h-full w-full justify-start"
        config={chartConfig}
      >
        <LineChart data={chartData}>
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
          {Object.keys(chartConfig).map((key) => {
            const isOpaque = hoveredMetricKey && !(key === hoveredMetricKey);
            return (
              <Line
                key={key}
                dataKey={key}
                stroke={chartConfig[key as keyof typeof chartConfig].color}
                strokeWidth={2}
                strokeOpacity={isOpaque ? 0.3 : 1}
                dot={false}
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
              <Area
                type="monotone"
                dataKey={appliedMetrics[0]}
                stroke="#3F3F46"
                fill="#1f1f1f"
                fillOpacity={0.3}
                strokeWidth={1}
                dot={false}
              />
            </AreaChart>
          </Brush>
        </LineChart>
      </ChartContainer>
    </div>
  );
};
