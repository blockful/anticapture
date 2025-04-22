"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  formatNumberUserReadable,
  timestampToReadableDate,
} from "@/lib/client/utils";
import { DaoMetricsDayBucket } from "@/lib/dao-config/types";
import { TokenDistributionCustomTooltip } from "@/components/atoms";
import { ClockwiseIcon } from "@/components/atoms/icons/ClockwiseIcon";

interface MultilineChartTokenDistributionProps {
  datasets: Record<string, DaoMetricsDayBucket[] | undefined>;
  chartConfig: Record<string, { label: string; color: string }>;
  filterData?: string;
  mocked?: boolean;
}

export const MultilineChartTokenDistribution = ({
  datasets,
  chartConfig,
  filterData,
  mocked = false,
}: MultilineChartTokenDistributionProps) => {
  if (!datasets || Object.keys(datasets).length === 0) {
    return null;
  }

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
        dataPoint[key] = entry ? Number(entry.high) : null;
      });

      return dataPoint;
    });

  const visibleDataSets = Object.keys(datasets).filter(
    (item) => item !== filterData,
  );

  return (
    <div className="relative flex h-[300px] w-full items-center justify-center rounded-lg border-lightDark bg-dark p-4 text-white">
      {mocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full bg-dark px-4 py-2 text-foreground text-sm">
            <ClockwiseIcon className="h-5 w-5 text-foreground" />
            RESEARCH PENDING
          </div>
        </div>
      )}
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <LineChart data={chartData}>
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="date"
            scale="time"
            type="number"
            domain={["auto", "auto"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(date) => timestampToReadableDate(date)}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) =>
              formatNumberUserReadable(
                Number(BigInt(Number(value)) / BigInt(10 ** 18)),
              )
            }
          />
          <Tooltip
            content={
              <TokenDistributionCustomTooltip chartConfig={chartConfig} />
            }
          />
          {Object.keys(chartConfig)
            .filter((item) => visibleDataSets.includes(item))
            .map((key) => (
              <Line
                key={key}
                dataKey={key}
                stroke={chartConfig[key as keyof typeof chartConfig].color}
                strokeWidth={2}
                dot={false}
              />
            ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
};
