import { useMemo } from "react";
import {
  QueryInput_Transfers_SortBy,
  QueryInput_Transfers_SortOrder,
  useBalanceHistoryGraphQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimePeriod } from "@/features/holders-and-delegates/components/TimePeriodSwitcher";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import { formatUnits } from "viem";
import daoConfig from "@/shared/dao-config";

export interface BalanceHistoryGraphItem {
  timestamp: number;
  amount: number;
  fromAccountId: string | null;
  toAccountId: string | null;
  transactionHash: string;
  direction: "in" | "out";
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

  // Calculate timestamp range based on time period
  const { fromTimestamp } = useMemo(() => {
    const nowInSeconds = Date.now() / 1000;

    // For "all", treat as all time by not setting limits
    if (timePeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    let daysInSeconds: number;
    switch (timePeriod) {
      case "90d":
        daysInSeconds = 90 * SECONDS_PER_DAY;
        break;
      default:
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
    }

    const fromTimestamp = Math.floor(nowInSeconds - daysInSeconds);
    const toTimestamp = Math.floor(nowInSeconds);

    return { fromTimestamp, toTimestamp };
  }, [timePeriod]);

  const { data, loading, error } = useBalanceHistoryGraphQuery({
    variables: {
      accountId,
      fromDate: fromTimestamp,
      sortBy: QueryInput_Transfers_SortBy.Timestamp,
      sortOrder: QueryInput_Transfers_SortOrder.Desc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    fetchPolicy: "cache-and-network",
  });

  const balanceHistory = useMemo((): BalanceHistoryGraphItem[] => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items
      .filter((item) => item !== null)
      .map((item) => {
        const amount = Number(formatUnits(BigInt(item.amount), decimals));

        return {
          ...item,
          timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
          amount,
          direction: (item.fromAccountId === accountId ? "out" : "in") as
            | "in"
            | "out",
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically for chart display
  }, [data, accountId, decimals]);

  return {
    balanceHistory,
    loading,
    error,
  };
}
