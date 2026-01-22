import { useMemo } from "react";
import { useBalanceHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimePeriod } from "@/features/holders-and-delegates/components/TimePeriodSwitcher";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import { formatUnits } from "viem";
import daoConfig from "@/shared/dao-config";
import {
  QueryInput_HistoricalBalances_OrderBy,
  QueryInput_HistoricalBalances_OrderDirection,
} from "@anticapture/graphql-client";

export interface BalanceHistoryGraphItem {
  timestamp: number;
  balance: number;
  from: string | null;
  to: string | null;
  transactionHash: string;
  direction: "in" | "out";
  logIndex: number;
}

// Interface for the hook result
export interface UseBalanceHistoryGraphResult {
  balanceHistory: BalanceHistoryGraphItem[];
  loading: boolean;
  error: unknown;
}

export function useBalanceHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  timePeriod: TimePeriod = "all",
): UseBalanceHistoryGraphResult {
  const { decimals } = daoConfig[daoId];

  const fromDate = useMemo(() => {
    const nowInSeconds = Date.now() / 1000;

    // For "all", treat as all time by not setting limits
    if (timePeriod === "all") return undefined;

    let daysInSeconds: number;
    switch (timePeriod) {
      case "90d":
        daysInSeconds = 90 * SECONDS_PER_DAY;
        break;
      default:
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
    }

    return Math.floor(nowInSeconds - daysInSeconds).toString();
  }, [timePeriod]);

  const { data, loading, error } = useBalanceHistoryGraphQuery({
    variables: {
      address: accountId,
      fromDate,
      orderBy: QueryInput_HistoricalBalances_OrderBy.Timestamp,
      orderDirection: QueryInput_HistoricalBalances_OrderDirection.Asc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const balanceHistory = useMemo((): BalanceHistoryGraphItem[] => {
    if (!data?.historicalBalances?.items) return [];

    return data.historicalBalances.items
      .filter((item) => !!item)
      .map((item) => ({
        ...item,
        timestamp: Number(item.timestamp),
        balance: Number(formatUnits(BigInt(item.balance), decimals)),
        direction: (item.transfer.from === accountId ? "out" : "in") as
          | "in"
          | "out",
        from: item.transfer.from,
        to: item.transfer.to,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, accountId, decimals]);

  return {
    balanceHistory,
    loading,
    error,
  };
}
