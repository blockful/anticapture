"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";
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

import {
  TimePeriod,
  TimePeriodSwitcher,
} from "@/features/holders-and-delegates/components/TimePeriodSwitcher";
import {
  BalanceHistoryGraphItem,
  useBalanceHistoryGraph,
} from "@/features/holders-and-delegates/hooks/useBalanceHistoryGraph";
import { getTimestampRangeFromPeriod } from "@/features/holders-and-delegates/utils";
import { ChartExceptionState } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { ChartContainer } from "@/shared/components/ui/chart";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  timestampToReadableDate,
  formatNumberUserReadable,
} from "@/shared/utils";

interface BalanceHistoryVariationGraphProps {
  accountId: string;
  daoId: DaoIdEnum;
}

interface CustomDotProps {
  cx: number;
  cy: number;
  payload: {
    timestamp: number;
    amount: number;
    direction?: "in" | "out";
    transactionHash?: string;
    fromAccountId?: string;
    toAccountId?: string;
    logIndex?: number;
  };
}

const chartConfig = {
  amount: {
    label: "Transfer",
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

export const BalanceHistoryVariationGraph = ({
  accountId,
  daoId,
}: BalanceHistoryVariationGraphProps) => {
  const [selectedPeriod, setSelectedPeriod] = useQueryState(
    "selectedPeriod",
    parseAsStringEnum<TimePeriod>(["30d", "90d", "all"]).withDefault("all"),
  );

  const { fromTimestamp: fromDate } = useMemo(
    () => getTimestampRangeFromPeriod(selectedPeriod),
    [selectedPeriod],
  );

  const { balanceHistory, loading, error } = useBalanceHistoryGraph(
    accountId,
    daoId,
    fromDate,
  );

  if (loading) {
    return (
      <div className="w-full">
        <ChartExceptionState
          state="loading"
          title="BALANCE HISTORY"
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
          title="BALANCE HISTORY"
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

  if (!balanceHistory || balanceHistory.length === 0) {
    return (
      <div className="w-full">
        <ChartExceptionState
          state="no-data"
          title="BALANCE HISTORY"
          noDataMessage="No balance history data found for this address"
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

  const head = balanceHistory[0];
  const extendedChartData = [
    {
      timestamp: fromDate
        ? fromDate * 1000
        : // 1 day in milliseconds to avoid hover conflict when max data is selected
          head?.timestamp - 86400000,
      balance:
        head?.balance +
        (head?.direction === "in" ? -head?.amount : +head?.amount),
    },
    ...balanceHistory,
    {
      timestamp: Date.now(),
      balance: balanceHistory[balanceHistory.length - 1]?.balance,
    },
  ];

  // Custom dot component to show each transfer/delegation point
  const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, payload } = props;
    return (
      <Dot
        key={`${payload.transactionHash}-${payload.logIndex}`}
        cx={cx}
        cy={cy}
        r={4}
        fill={
          payload.direction === "in"
            ? "var(--base-success)"
            : "var(--base-error)"
        }
        stroke={
          payload.direction === "in"
            ? "var(--base-success)"
            : "var(--base-error)"
        }
        strokeWidth={2}
        className="cursor-pointer"
      />
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-secondary font-mono text-[13px] font-medium uppercase">
          BALANCE HISTORY
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
                  const data = payload[0]?.payload as BalanceHistoryGraphItem;

                  // Determine which address to show based on transaction type and direction
                  const getDisplayAddress = () => {
                    if (data.direction === "in") {
                      return data.from;
                    }
                    if (data.direction === "out") {
                      return data.to;
                    }
                  };

                  const displayAddress = getDisplayAddress();

                  return (
                    <div className="bg-surface-contrast border-light-dark rounded-lg border p-3 shadow-lg">
                      <p className="text-primary text-sm font-medium">
                        {timestampToReadableDate(Number(data.timestamp) / 1000)}
                      </p>
                      <p className="text-secondary flex gap-1 text-xs">
                        Balance:
                        {` ${formatNumberUserReadable(Number(data.balance))}`}
                      </p>
                      {data.direction && (
                        <p className="text-secondary flex gap-1 text-xs">
                          Type:
                          <p
                            className={`text-xs ${data.direction === "in" ? "text-success" : data.direction === "out" ? "text-error" : "text-primary"}`}
                          >
                            {data.direction === "in" ? "Buy" : "Sell"}
                          </p>
                        </p>
                      )}

                      {displayAddress && (
                        <p className="text-secondary text-xs">
                          {data.direction === "in" ? "Buy from" : "Sell to"}:
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
              dataKey="balance"
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
