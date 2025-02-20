"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useTokenDistributionContext } from "../contexts";
import { formatDate, formatNumberUserReadable } from "@/lib/client/utils";
import { DaoMetricsDayBucket } from "@/lib/server/backend";

const chartConfig = {
  totalSupply: { label: "Total Supply", color: "hsl(var(--chart-1))" },
  delegatedSupply: { label: "Delegated Supply", color: "hsl(var(--chart-2))" },
  circulatingSupply: {
    label: "Circulating Supply",
    color: "hsl(var(--chart-3))",
  },
  cexSupply: { label: "CEX Supply", color: "hsl(var(--chart-4))" },
  dexSupply: { label: "DEX Supply", color: "hsl(var(--chart-5))" },
  lendingSupply: { label: "Lending Supply", color: "hsl(var(--chart-7))" },
} satisfies ChartConfig;

export const TheChart = () => {
  const {
    totalSupplyChart,
    delegatedSupplyChart,
    circulatingSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
  } = useTokenDistributionContext();

  const datasets: Record<keyof typeof chartConfig, DaoMetricsDayBucket[]> = {
    totalSupply: totalSupplyChart,
    delegatedSupply: delegatedSupplyChart,
    circulatingSupply: circulatingSupplyChart,
    cexSupply: cexSupplyChart,
    dexSupply: dexSupplyChart,
    lendingSupply: lendingSupplyChart,
  };

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

  const minDate = Math.min(...Array.from(allDates).map(Number));
  const maxDate = Math.max(...Array.from(allDates).map(Number));

  const minValue = Math.min(
    ...chartData.flatMap((item) =>
      Object.values(item).map((value) =>
        typeof value === "number" ? value : Infinity,
      ),
    ),
  );
  const maxValue = Math.max(
    ...chartData.flatMap((item) =>
      Object.values(item).map((value) =>
        typeof value === "number" ? value : -Infinity,
      ),
    ),
  );

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
    active,
    payload,
    label,
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="rounded bg-white p-2 text-black shadow-md">
        <p className="font-bold">Date: {formatDate(Number(label))}</p>
        {payload.map((entry, index) => {
          const value = entry.value !== undefined ? entry.value : 0;

          return (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}:{" "}
              <strong>
                {value !== 0
                  ? formatNumberUserReadable(
                      Number(BigInt(Math.floor(value)) / BigInt(10 ** 18)),
                    )
                  : "No Data"}
              </strong>
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-lightDark bg-dark p-10 text-white">
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} stroke="#27272a" />
            <XAxis
              dataKey="date"
              scale="time"
              type="number"
              domain={[minDate, maxDate]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(date) => formatDate(date)}
            />
            <YAxis
              domain={[minValue * 0.9, maxValue * 1.1]}
              tickFormatter={(value) =>
                formatNumberUserReadable(
                  Number(BigInt(Number(value)) / BigInt(10 ** 18)),
                )
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {Object.keys(chartConfig).map((key) => (
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
