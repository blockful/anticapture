"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/shared/components/ui/chart";

// Fake data matching the image trend: starts around 9.5% and decreases to ~5.5%
const fakeData = [
  { date: "Jan '25", percentage: 9.5 },
  { date: "Apr '25", percentage: 7.5 },
  { date: "Jul '25", percentage: 7.0 },
  { date: "Oct '25", percentage: 5.8 },
  { date: "Jan '26", percentage: 5.5 },
];

const chartConfig: ChartConfig = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#FF6B6B",
  },
} satisfies ChartConfig;

export const DelegatedSupplyHistory = () => {
  return (
    <div className="bg-surface-default flex w-full flex-col gap-4 rounded-lg p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-[20px] tracking-[0.78px]">
          delegated supply history
        </h3>
        <p className="text-secondary text-sm font-normal leading-[20px]">
          Fewer tokens are delegated out of the total supply, making it easier
          for attackers to gain influence. The chart shows how this share
          changes over time.
        </p>
      </div>
      <div className="relative flex h-[180px] w-full items-center justify-center pb-2">
        <ChartContainer className="h-full w-full" config={chartConfig}>
          <LineChart
            data={fakeData}
            margin={{ top: 0, right: 16, left: 32, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#27272a" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{
                fill: "var(--color-secondary)",
                fontSize: 12,
                fontFamily: "Inter",
                fontWeight: 400,
              }}
              tickFormatter={(value) => value}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tickFormatter={(value) => (value === 0 ? "0" : `${value}%`)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={28}
              tick={{
                fill: "var(--color-secondary)",
                fontSize: 12,
                fontFamily: "Inter",
                fontWeight: 400,
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0];
                return (
                  <div className="border-light-dark bg-surface-default text-primary rounded-lg border px-3 py-2 shadow-lg">
                    <p className="text-secondary text-xs">{label}</p>
                    <p className="text-primary text-sm font-medium">
                      {data.value}%
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke="#FF6B6B"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
        {/* X-axis pointers (vertical lines above labels) */}
        <div className="absolute bottom-[24px] left-[32px] right-[16px] flex justify-between">
          {fakeData.map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center"
              style={{ width: `${100 / fakeData.length}%` }}
            >
              <div className="bg-surface-contrast h-[8px] w-px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
