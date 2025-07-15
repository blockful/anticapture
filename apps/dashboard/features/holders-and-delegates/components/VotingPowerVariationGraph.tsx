"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Dot,
} from "recharts";
import { ChartContainer } from "@/shared/components/ui/chart";
import { timestampToReadableDate } from "@/shared/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils";
import { useState } from "react";
import { useDelegateDelegationHistoryGraph } from "../hooks/useDelegateDelegationHistoryGraph";

interface VotingPowerVariationGraphProps {
  accountId: string;
  daoId: DaoIdEnum;
}

const chartConfig = {
  votingPower: {
    label: "Voting Power",
    color: "hsl(var(--chart-1))",
  },
};

type TimePeriod = "30d" | "90d" | "all";

export const VotingPowerVariationGraph = ({
  accountId,
  daoId,
}: VotingPowerVariationGraphProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("all");

  const { delegationHistory, loading, error } =
    useDelegateDelegationHistoryGraph(accountId, daoId, selectedPeriod);

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-lg font-semibold">
            VOTING POWER VARIATION
          </h3>
          <div className="flex gap-2">
            <div className="bg-surface-contrast h-8 w-12 animate-pulse rounded-md" />
            <div className="bg-surface-contrast h-8 w-12 animate-pulse rounded-md" />
            <div className="bg-surface-contrast h-8 w-16 animate-pulse rounded-md" />
          </div>
        </div>
        <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg">
          <div className="text-secondary text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-lg font-semibold">
            VOTING POWER VARIATION
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs"
              disabled
            >
              30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs"
              disabled
            >
              90d
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs"
              disabled
            >
              All time
            </Button>
          </div>
        </div>
        <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg">
          <div className="text-secondary text-sm">Error loading data</div>
        </div>
      </div>
    );
  }

  if (!delegationHistory || delegationHistory.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-lg font-semibold">
            VOTING POWER VARIATION
          </h3>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "30d" ? "default" : "outline"}
              size="sm"
              className="px-3 py-1 text-xs"
              onClick={() => setSelectedPeriod("30d")}
            >
              30d
            </Button>
            <Button
              variant={selectedPeriod === "90d" ? "default" : "outline"}
              size="sm"
              className="px-3 py-1 text-xs"
              onClick={() => setSelectedPeriod("90d")}
            >
              90d
            </Button>
            <Button
              variant={selectedPeriod === "all" ? "default" : "outline"}
              size="sm"
              className="px-3 py-1 text-xs"
              onClick={() => setSelectedPeriod("all")}
            >
              All time
            </Button>
          </div>
        </div>
        <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg">
          <div className="text-secondary text-sm">
            No voting power data available
          </div>
        </div>
      </div>
    );
  }

  const chartData = delegationHistory
    .map((dataPoint) => ({
      timestamp: dataPoint.timestamp,
      votingPower: dataPoint.votingPower,
      delta: dataPoint.delta,
      type: dataPoint.type,
      isGain: dataPoint.isGain,
      transactionHash: dataPoint.transactionHash,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Custom dot component to show each transfer/delegation point
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={4}
        fill={payload.isGain ? "#10b981" : "#ef4444"}
        stroke={payload.isGain ? "#10b981" : "#ef4444"}
        strokeWidth={2}
        className="cursor-pointer"
      />
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-primary text-lg font-semibold">
          VOTING POWER VARIATION
        </h3>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === "30d" ? "default" : "outline"}
            size="sm"
            className="px-3 py-1 text-xs"
            onClick={() => setSelectedPeriod("30d")}
          >
            30d
          </Button>
          <Button
            variant={selectedPeriod === "90d" ? "default" : "outline"}
            size="sm"
            className="px-3 py-1 text-xs"
            onClick={() => setSelectedPeriod("90d")}
          >
            90d
          </Button>
          <Button
            variant={selectedPeriod === "all" ? "default" : "outline"}
            size="sm"
            className="px-3 py-1 text-xs"
            onClick={() => setSelectedPeriod("all")}
          >
            All time
          </Button>
        </div>
      </div>
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
                  const data = payload[0].payload;
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
                              BigInt(Number(payload[0].value)) /
                                BigInt(10 ** 18),
                            ),
                          )}
                        </span>
                      </p>
                      <p className="text-secondary text-sm">
                        Type:{" "}
                        <span className="text-primary font-medium capitalize">
                          {data.type}
                        </span>
                      </p>
                      <p className="text-secondary text-sm">
                        Change:{" "}
                        <span
                          className={cn(
                            "font-medium",
                            data.isGain ? "text-green-500" : "text-red-500",
                          )}
                        >
                          {data.isGain ? "+" : ""}
                          {formatNumberUserReadable(
                            Number(
                              BigInt(Number(data.delta)) / BigInt(10 ** 18),
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
              dot={<CustomDot />}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};
