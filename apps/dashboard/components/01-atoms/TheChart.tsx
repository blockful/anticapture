"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 10000 },
  { month: "March", desktop: 437 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 1000 },
  { month: "June", desktop: 2000 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const TheChart = () => {
  return (
    <div className="flex max-h-14 w-full max-w-52 items-center justify-center">
      <ChartContainer config={chartConfig} className="h-[50%] w-full max-w-52">
        <ResponsiveContainer
          width="100%"
          height="50%"
          style={{
            display: "flex",
          }}
        >
          <AreaChart data={chartData}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              dataKey="desktop"
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
