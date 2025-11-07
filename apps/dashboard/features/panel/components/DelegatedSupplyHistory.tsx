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
import { useDelegationPercentageByDay } from "@/shared/hooks";
import { useMemo } from "react";
import { SkeletonRow } from "@/shared/components";

const chartConfig: ChartConfig = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#FF6B6B",
  },
} satisfies ChartConfig;

export const DelegatedSupplyHistory = () => {
  // Calculate startDate as one year ago in seconds (Unix timestamp)
  const startDate = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return Math.floor(oneYearAgo.getTime() / 1000).toString();
  }, []);

  // Calculate endDate as today at midnight UTC in seconds (Unix timestamp)
  const endDate = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return Math.floor(today.getTime() / 1000).toString();
  }, []);

  const { data, loading, error } = useDelegationPercentageByDay(
    startDate,
    endDate,
  );

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((item) => {
        // Parse date string as Unix timestamp (seconds) and convert to Date
        // Handle both string timestamps and ensure valid number
        if (!item.date || item.date === "" || isNaN(Number(item.date))) {
          console.warn("Invalid date value:", item.date);
          return null;
        }

        const timestamp = Number(item.date);
        const date = new Date(timestamp * 1000);

        // Validate date
        if (isNaN(date.getTime())) {
          console.warn("Invalid date after parsing:", item.date, timestamp);
          return null;
        }

        const month = date.toLocaleDateString("en-US", { month: "short" });
        const year = date.getFullYear().toString().slice(-2);
        const formattedDate = `${month} '${year}`;

        // Convert high (string) to percentage number
        const percentage = parseFloat(item.high);
        if (isNaN(percentage)) {
          console.warn("Invalid percentage value:", item.high);
          return null;
        }

        return {
          date: formattedDate,
          percentage,
          timestamp: date.getTime(),
          originalDate: item.date, // Keep original for tooltip
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [data]);

  // Calculate Y-axis domain and ticks with standard increments (5% or 10%)
  const yAxisConfig = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        domain: [0, 10] as [number, number],
        ticks: [0, 5, 10],
      };
    }

    const percentages = chartData.map((item) => item.percentage);
    const minValue = Math.min(...percentages);
    const maxValue = Math.max(...percentages);
    const range = maxValue - minValue;

    // Determine appropriate increment: use 5% for smaller ranges, 10% for larger ranges
    const increment = range <= 15 ? 5 : 10;

    // Round down min to nearest multiple of increment, round up max to nearest multiple
    const minDomain = Math.max(0, Math.floor(minValue / increment) * increment);
    const maxDomain = Math.ceil(maxValue / increment) * increment;

    // Ensure minimum range for better visualization
    const adjustedMaxDomain =
      maxDomain - minDomain < increment * 2
        ? minDomain + increment * 2
        : maxDomain;

    // Generate ticks at standard intervals (5% or 10%)
    const ticks: number[] = [];
    for (
      let value = minDomain;
      value <= adjustedMaxDomain;
      value += increment
    ) {
      ticks.push(value);
    }

    return {
      domain: [minDomain, adjustedMaxDomain] as [number, number],
      ticks,
    };
  }, [chartData]);

  if (loading) {
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
        <div className="relative flex h-[150px] w-full items-center justify-center pb-2">
          <SkeletonRow className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (error || !chartData || chartData.length === 0) {
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
        <div className="relative flex h-[150px] w-full items-center justify-center pb-2">
          <p className="text-secondary text-sm">No data available</p>
        </div>
      </div>
    );
  }

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
      <div className="relative flex h-[150px] w-full items-center justify-center pb-2">
        <ChartContainer className="h-full w-full" config={chartConfig}>
          <LineChart
            data={chartData}
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
              domain={yAxisConfig.domain}
              ticks={yAxisConfig.ticks}
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
        <div className="absolute bottom-0 left-[32px] right-[16px] flex justify-between">
          {chartData.map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center"
              style={{ width: `${100 / chartData.length}%` }}
            >
              <div className="bg-surface-contrast h-[8px] w-px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
