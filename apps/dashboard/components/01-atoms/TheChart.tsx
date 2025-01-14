"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartMetrics, chartMetrics } from "@/lib/mocked-data";

const transformChartMetrics = (data: ChartMetrics[]) => {
  return data.map((item: ChartMetrics) => ({
    date: new Date(Number(item.dayTimestamp)).toISOString().split("T")[0],
    high: Number(item.high),
  }));
};

const formattedChartMetrics = transformChartMetrics(chartMetrics);

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const TheChart = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedChartMetrics}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              dataKey="high"
              type="linear"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
