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
import { useState } from "react";
import { useDelegateDelegationHistoryGraph } from "../hooks/useDelegateDelegationHistoryGraph";
import {
  VotingPowerTimePeriodSwitcher,
  VotingPowerTimePeriod,
} from "./VotingPowerTimePeriodSwitcher";
import { SkeletonRow } from "@/shared/components";

interface VotingPowerVariationGraphProps {
  accountId: string;
  daoId: DaoIdEnum;
}

const chartConfig = {
  votingPower: {
    label: "Voting Power",
    color: "#3b82f6",
  },
};

export const VotingPowerVariationGraph = ({
  accountId,
  daoId,
}: VotingPowerVariationGraphProps) => {
  const [selectedPeriod, setSelectedPeriod] =
    useState<VotingPowerTimePeriod>("all");

  const { delegationHistory, loading, error } =
    useDelegateDelegationHistoryGraph(accountId, daoId, selectedPeriod);

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-lg font-semibold">
            VOTING POWER VARIATION
          </h3>
          <VotingPowerTimePeriodSwitcher
            defaultValue="all"
            setTimePeriod={setSelectedPeriod}
            isSmall={true}
          />
        </div>
        <div className="h-[300px] w-full">
          <SkeletonRow className="h-[300px] w-full" />
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
          <VotingPowerTimePeriodSwitcher
            defaultValue="all"
            setTimePeriod={setSelectedPeriod}
            isSmall={true}
          />
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
          <VotingPowerTimePeriodSwitcher
            defaultValue="all"
            setTimePeriod={setSelectedPeriod}
            isSmall={true}
          />
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
        <VotingPowerTimePeriodSwitcher
          defaultValue="all"
          setTimePeriod={setSelectedPeriod}
          isSmall={true}
        />
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart
          data={chartData}
          margin={{ top: 25, right: 30, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
            }}
            stroke="#9ca3af"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value) => formatNumberUserReadable(value)}
            stroke="#9ca3af"
            fontSize={12}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-surface-contrast border-light-dark rounded-lg border p-3 shadow-lg">
                    <p className="text-primary text-sm font-medium">
                      {timestampToReadableDate(data.timestamp / 1000)}
                    </p>
                    <p className="text-secondary text-xs">
                      Voting Power: {formatNumberUserReadable(data.votingPower)}
                    </p>
                    <p className="text-secondary text-xs">Type: {data.type}</p>
                    <p
                      className={`text-xs ${data.isGain ? "text-green-500" : "text-red-500"}`}
                    >
                      {data.isGain ? "+" : ""}
                      {formatNumberUserReadable(parseFloat(data.delta))}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="votingPower"
            stroke="#ffffff"
            strokeWidth={1}
            dot={<CustomDot />}
            connectNulls={true}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};
