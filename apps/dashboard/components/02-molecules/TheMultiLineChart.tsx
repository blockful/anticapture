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
import { useTokenDistributionContext } from "@/components/contexts";
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

export const TheMultiLineChart = () => {
  const {
    totalSupplyChart,
    delegatedSupplyChart,
    circulatingSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
  } = useTokenDistributionContext();

  //TODO: Add this datasets into params to create a generic the-chart
  const datasets: Record<keyof typeof chartConfig, DaoMetricsDayBucket[]> = {
    totalSupply: totalSupplyChart,
    delegatedSupply: delegatedSupplyChart,
    circulatingSupply: circulatingSupplyChart,
    cexSupply: cexSupplyChart,
    dexSupply: dexSupplyChart,
    lendingSupply: lendingSupplyChart,
  };

  //TODO: Create a button to define a variable to filter correctly the-chart graph, example:
  const dataSetKey = ""; // Add "totalSupply" to filter the chart making this value disappear
  const newDataSets = Object.keys(datasets).filter(
    (item) => item !== dataSetKey,
  );

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
          const formattedName =
            chartConfig[entry.name as keyof typeof chartConfig]?.label ??
            entry.name;

          return (
            <p key={index} style={{ color: entry.color }}>
              {formattedName}:{" "}
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
              tickFormatter={(date) => formatDate(date)}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(value) =>
                formatNumberUserReadable(
                  Number(BigInt(Number(value)) / BigInt(10 ** 18)),
                )
              }
            />
            <Tooltip content={<CustomTooltip />} />
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
