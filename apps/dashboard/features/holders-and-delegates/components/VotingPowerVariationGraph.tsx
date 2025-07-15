"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/shared/components/ui/chart";
import { timestampToReadableDate } from "@/shared/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";

interface VotingPowerDataPoint {
  timestamp: number;
  votingPower: number;
}

interface VotingPowerVariationGraphProps {
  accountId: string;
  daoId: DaoIdEnum;
  data: VotingPowerDataPoint[];
  loading?: boolean;
}

const chartConfig = {
  votingPower: {
    label: "Voting Power",
    color: "hsl(var(--chart-1))",
  },
};

export const VotingPowerVariationGraph = ({
  accountId,
  daoId,
  data,
  loading = false,
}: VotingPowerVariationGraphProps) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg">
        <div className="text-secondary text-sm">
          {loading ? "Loading..." : "No voting power data available"}
        </div>
      </div>
    );
  }

  const chartData = data
    .map((dataPoint) => ({
      timestamp: dataPoint.timestamp,
      votingPower: dataPoint.votingPower,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg">
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <LineChart data={chartData}>
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={["auto", "auto"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(timestamp) => timestampToReadableDate(timestamp)}
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
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-surface-contrast border-middle-dark rounded-lg border p-3 shadow-lg">
                    <p className="text-primary text-sm font-medium">
                      {timestampToReadableDate(label as number)}
                    </p>
                    <p className="text-secondary text-sm">
                      Voting Power:{" "}
                      <span className="text-primary font-medium">
                        {formatNumberUserReadable(
                          Number(
                            BigInt(Number(payload[0].value)) / BigInt(10 ** 18),
                          ),
                        )}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            dataKey="votingPower"
            stroke={chartConfig.votingPower.color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};
