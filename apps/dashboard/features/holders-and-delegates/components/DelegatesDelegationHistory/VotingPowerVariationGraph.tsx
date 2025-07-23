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
import { useDelegateDelegationHistoryGraph } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistoryGraph";
import {
  VotingPowerTimePeriodSwitcher,
  VotingPowerTimePeriod,
} from "@/features/holders-and-delegates/components/DelegatesDelegationHistory/VotingPowerTimePeriodSwitcher";
import { ChartExceptionState } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";

interface VotingPowerVariationGraphProps {
  accountId: string;
  daoId: DaoIdEnum;
}

interface CustomDotProps {
  cx: number;
  cy: number;
  payload: {
    timestamp: number;
    votingPower: number;
    delta: number;
    type: string;
    isGain: boolean;
    transactionHash: string;
    fromAddress?: string;
    toAddress?: string;
  };
}

const chartConfig = {
  votingPower: {
    label: "Voting Power",
    color: "#3b82f6",
  },
};

const generateMonthlyTicks = (chartData: Array<{ timestamp: number }>) => {
  if (!chartData.length) return [];

  const firstTimestamp = Math.min(...chartData.map((d) => d.timestamp));
  const lastTimestamp = Math.max(...chartData.map((d) => d.timestamp));

  const ticks = [];
  const startDate = new Date(firstTimestamp);
  const endDate = new Date(lastTimestamp);

  // Start from the first day of the month containing the first data point
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    ticks.push(current.getTime());
    current.setMonth(current.getMonth() + 1);
  }

  return ticks;
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
        <ChartExceptionState
          state="loading"
          title="VOTING POWER VARIATION"
          headerContent={
            <VotingPowerTimePeriodSwitcher
              value={selectedPeriod}
              setTimePeriod={setSelectedPeriod}
              isSmall={true}
            />
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <ChartExceptionState
          state="error"
          title="VOTING POWER VARIATION"
          errorMessage="Error loading data"
          headerContent={
            <VotingPowerTimePeriodSwitcher
              value={selectedPeriod}
              setTimePeriod={setSelectedPeriod}
              isSmall={true}
            />
          }
        />
      </div>
    );
  }

  if (!delegationHistory || delegationHistory.length === 0) {
    return (
      <div className="w-full">
        <ChartExceptionState
          state="no-data"
          title="VOTING POWER VARIATION"
          noDataMessage="No voting power data available"
          headerContent={
            <VotingPowerTimePeriodSwitcher
              value={selectedPeriod}
              setTimePeriod={setSelectedPeriod}
              isSmall={true}
            />
          }
        />
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
      fromAddress: dataPoint.fromAddress,
      toAddress: dataPoint.toAddress,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Custom dot component to show each transfer/delegation point
  const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, payload } = props;
    return (
      <Dot
        key={payload.transactionHash}
        cx={cx}
        cy={cy}
        r={4}
        fill={payload.isGain ? "var(--base-success)" : "var(--base-error)"}
        stroke={payload.isGain ? "var(--base-success)" : "var(--base-error)"}
        strokeWidth={2}
        className="cursor-pointer"
      />
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-secondary font-mono text-[13px] font-medium uppercase">
          VOTING POWER VARIATION
        </h3>
        <VotingPowerTimePeriodSwitcher
          value={selectedPeriod}
          setTimePeriod={setSelectedPeriod}
          isSmall={true}
        />
      </div>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <LineChart
          data={chartData}
          margin={{ top: 25, right: 30, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--base-border)" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={generateMonthlyTicks(chartData)}
            tickFormatter={(value: number) => {
              const date = new Date(value);
              const month = date.toLocaleDateString("en-US", {
                month: "short",
              });
              const year = date.getFullYear().toString().slice(-2);
              return `${month} '${year}`;
            }}
            stroke="var(--base-dimmed)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value: number) => formatNumberUserReadable(value)}
            stroke="var(--base-dimmed)"
            fontSize={12}
          />
          <Tooltip
            content={({ active, payload }: { active: boolean; payload: any }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;

                // Determine which address to show based on transaction type and direction
                const getDisplayAddress = () => {
                  if (data.type === "delegation") {
                    return data.isGain ? data.fromAddress : data.toAddress;
                  } else if (data.type === "transfer") {
                    return data.isGain ? data.fromAddress : data.toAddress;
                  }
                  return null;
                };

                const displayAddress = getDisplayAddress();
                const addressLabel =
                  data.type === "delegation"
                    ? "Delegated from"
                    : "Transferred from";

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
                      className={`text-xs ${data.isGain ? "text-success" : "text-error"}`}
                    >
                      {data.isGain && "+"}
                      {formatNumberUserReadable(parseFloat(data.delta))}
                    </p>
                    <p className="text-secondary text-xs">{addressLabel}:</p>
                    {displayAddress && (
                      <EnsAvatar
                        address={displayAddress}
                        showAvatar={false}
                        size="xs"
                        className="mt-2"
                        nameClassName="text-xs"
                        containerClassName="mt-2 flex h-10 items-center gap-2 bg-blue-400"
                      />
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="votingPower"
            stroke="var(--base-primary)"
            strokeWidth={1}
            dot={CustomDot}
            connectNulls={true}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};
