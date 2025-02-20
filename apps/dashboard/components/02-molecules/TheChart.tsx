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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTokenDistributionContext } from "../contexts";
import { formatNumberUserReadable } from "@/lib/client/utils";

const chartConfig = {
  metricValue: {
    label: "Metric Value",
  },
  totalSupply: {
    label: "Total Supply",
    color: "hsl(var(--chart-1))",
  },
  delegatedSupply: {
    label: "Delegated Supply",
    color: "hsl(var(--chart-2))",
  },
  circulatingSupply: {
    label: "Circulating Supply",
    color: "hsl(var(--chart-3))",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "hsl(var(--chart-4))",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "hsl(var(--chart-5))",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "hsl(var(--chart-7))",
  },
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

  const allDates = new Set([
    ...totalSupplyChart.map((item) => item.date),
    ...delegatedSupplyChart.map((item) => item.date),
    ...circulatingSupplyChart.map((item) => item.date),
    ...cexSupplyChart.map((item) => item.date),
    ...dexSupplyChart.map((item) => item.date),
    ...lendingSupplyChart.map((item) => item.date),
  ]);

  const chartData = Array.from(allDates).map((date) => ({
    date,
    totalSupply: totalSupplyChart.find((item) => item.date === date)?.high,
    delegatedSupply: delegatedSupplyChart.find((item) => item.date === date)
      ?.high,
    circulatingSupply: circulatingSupplyChart.find((item) => item.date === date)
      ?.high,
    cexSupply: cexSupplyChart.find((item) => item.date === date)?.high,
    dexSupply: dexSupplyChart.find((item) => item.date === date)?.high,
    lendingSupply: lendingSupplyChart.find((item) => item.date === date)?.high,
  }));

  const formatDate = (date: unknown) => {
    if (!date) return "Invalid Date";

    let timestamp: number;

    if (typeof date === "number") {
      timestamp = date * 1000;
    } else if (typeof date === "string" && !isNaN(Number(date))) {
      timestamp = Number(date) * 1000;
    } else {
      return "Invalid Date";
    }

    const newDateFormated = new Date(timestamp);

    return `${String(newDateFormated.getMonth() + 1).padStart(2, "0")}/${String(
      newDateFormated.getDate(),
    ).padStart(2, "0")}/${newDateFormated.getFullYear()}`;
  };

  return (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-lightDark bg-dark p-10 text-white">
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke="#27272a" />
            <XAxis
              dataKey="date"
              scale="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(date) => formatDate(date)}
            />
            <YAxis
              tickFormatter={(value) =>
                formatNumberUserReadable(
                  Number(BigInt(Number(value)) / BigInt(10 ** 18)),
                )
              }
            />

            <Tooltip
              labelFormatter={(value) => {
                return `Day: ${formatDate(value)}`;
              }}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="totalSupply"
              type="monotone"
              stroke={chartConfig.totalSupply.color}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
            <Line
              dataKey="delegatedSupply"
              type="monotone"
              stroke={chartConfig.delegatedSupply.color}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
            <Line
              dataKey="circulatingSupply"
              type="monotone"
              stroke={chartConfig.circulatingSupply.color}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
            <Line
              dataKey="cexSupply"
              type="monotone"
              stroke={chartConfig.cexSupply.color}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
            <Line
              dataKey="dexSupply"
              type="monotone"
              stroke={chartConfig.dexSupply.color}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
            <Line
              dataKey="lendingSupply"
              type="monotone"
              stroke={chartConfig.lendingSupply.color}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
