"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  formatNumberUserReadable,
  timestampToReadableDate,
} from "@/lib/client/utils";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";
import { TokenDistributionCustomTooltip } from "../atoms/TokenDistributionCustomTooltip";

interface MultilineChartTokenDistributionProps {
  datasets: Record<string, DaoMetricsDayBucket[]>;
  chartConfig: Record<string, { label: string; color: string }>;
  filterData?: string;
}

export const MultilineChartTokenDistribution = ({
  datasets,
  chartConfig,
  filterData,
}: MultilineChartTokenDistributionProps) => {
  const allDates = new Set(
    Object.values(datasets).flatMap((dataset) =>
      dataset.map((item) => item.date),
    ),
  );

  const fillMissingData = (
    dataset: DaoMetricsDayBucket[],
    date: string,
  ): number | null => {
    const entry = dataset.find((item) => item.date === date);
    return entry ? Number(entry.high) : null;
  };

  let lastKnownValues: Record<string, number | null> = {};

  const chartData = Array.from(allDates).map((date) => {
    const dataPoint: Record<string, any> = { date };

    Object.keys(datasets).forEach((key) => {
      const value = fillMissingData(
        datasets[key as keyof typeof datasets],
        date,
      );
      if (value !== null) lastKnownValues[key] = value;
      dataPoint[key] = lastKnownValues[key] ?? null;
    });

    return dataPoint;
  });

  const newDataSets = Object.keys(datasets).filter(
    (item) => item !== filterData,
  );

  return (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-lightDark bg-dark p-4 text-white">
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
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
              .filter((item) => newDataSets.includes(item))
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
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
