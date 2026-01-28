"use client";

import { useMemo } from "react";
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
import { DelegationHistoryGraphItem } from "@/features/holders-and-delegates/hooks";
import { useDelegateDelegationHistoryGraph } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistoryGraph";
import { TimePeriodSwitcher } from "@/features/holders-and-delegates/components/TimePeriodSwitcher";
import { ChartExceptionState } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";

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
    delta?: number;
    type?: string;
    isGain?: boolean;
    transactionHash?: string;
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

  const ticks: number[] = [];
  const startDate = new Date(firstTimestamp);
  const endDate = new Date(lastTimestamp);

  // Ensure the first tick aligns with the first data point to avoid leading blank space
  ticks.push(firstTimestamp);

  // Then add monthly ticks starting from the first day of the next month
  const current = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    1,
  );

  while (current <= endDate) {
    ticks.push(current.getTime());
    current.setMonth(current.getMonth() + 1);
  }

  return Array.from(new Set(ticks));
};

export const VotingPowerVariationGraph = ({
  accountId,
  daoId,
}: VotingPowerVariationGraphProps) => {
  const [selectedPeriod, setSelectedPeriod] = useQueryState(
    "selectedPeriod",
    parseAsStringEnum(["30d", "90d", "all"]).withDefault("all"),
  );

  // Calculate timestamp range based on time period
  const { fromTimestamp, toTimestamp } = useMemo(() => {
    // For "all", treat as all time by not setting limits
    if (selectedPeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    const nowInSeconds = Date.now() / 1000;
    let daysInSeconds: number;
    switch (selectedPeriod) {
      case "90d":
        daysInSeconds = 90 * SECONDS_PER_DAY;
        break;
      default:
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
    }

    return {
      fromTimestamp: Math.floor(nowInSeconds - daysInSeconds),
      toTimestamp: Math.floor(nowInSeconds),
    };
  }, [selectedPeriod]);

  const { delegationHistory, loading, error } =
    useDelegateDelegationHistoryGraph(
      accountId,
      daoId,
      fromTimestamp?.toString(),
      toTimestamp?.toString(),
    );

  const extendedChartData = useMemo(
    () => [
      {
        timestamp: fromTimestamp
          ? fromTimestamp * 1000
          : delegationHistory[0]?.timestamp - 10000,
        votingPower:
          delegationHistory[0]?.votingPower - delegationHistory[0]?.delta,
        isGain: true,
      },
      ...delegationHistory,
      {
        timestamp: toTimestamp ? toTimestamp * 1000 : Date.now(),
        votingPower:
          delegationHistory[delegationHistory.length - 1]?.votingPower,
        isGain: true,
      },
    ],
    [delegationHistory, fromTimestamp, toTimestamp],
  );

  if (loading) {
    return (
      <div className="w-full">
        <ChartExceptionState
          state="loading"
          title="VOTING POWER VARIATION"
          headerContent={
            <TimePeriodSwitcher
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
            <TimePeriodSwitcher
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
            <TimePeriodSwitcher
              value={selectedPeriod}
              setTimePeriod={setSelectedPeriod}
              isSmall={true}
            />
          }
        />
      </div>
    );
  }

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
        <TimePeriodSwitcher
          value={selectedPeriod}
          setTimePeriod={setSelectedPeriod}
          isSmall={true}
        />
      </div>
      <div className="relative h-[200px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={extendedChartData}
            margin={{ top: 25, right: 30, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--base-border)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={generateMonthlyTicks(extendedChartData)}
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
              content={(props) => {
                const { active, payload } = props;
                if (active && payload && payload.length) {
                  const data = payload[0]
                    ?.payload as DelegationHistoryGraphItem;

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
                  const type =
                    data.type === "delegation"
                      ? "Delegation"
                      : data.type === "transfer"
                        ? "Transfer"
                        : undefined;
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
                        Voting Power:{" "}
                        {formatNumberUserReadable(data.votingPower)}
                      </p>
                      {data.delta && (
                        <>
                          <p className="text-secondary text-xs">Type: {type}</p>
                          <p
                            className={`text-xs ${data.isGain ? "text-success" : "text-error"}`}
                          >
                            {data.isGain &&
                              data.transactionHash !== "initial" &&
                              "+"}
                            {formatNumberUserReadable(data.delta)}
                          </p>
                        </>
                      )}
                      {displayAddress && (
                        <p className="text-secondary text-xs">
                          {addressLabel}:
                        </p>
                      )}
                      {displayAddress && (
                        <EnsAvatar
                          address={displayAddress as `0x${string}`}
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
              type="stepAfter"
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
        <AnticaptureWatermark />
      </div>
    </div>
  );
};
