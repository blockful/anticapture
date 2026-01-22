import { useMemo } from "react";
import { formatUnits } from "viem";

import { useBalanceHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
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
  fromDate?: number,
): UseBalanceHistoryGraphResult {
  const { decimals } = daoConfig[daoId];

  const { data, loading, error } = useBalanceHistoryGraphQuery({
    variables: {
      address: accountId,
      fromDate: fromDate?.toString(),
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
        timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
        balance: Number(formatUnits(BigInt(item.balance), decimals)),
        direction: item.transfer.from === accountId ? "out" : "in",
        from: item.transfer.from,
        to: item.transfer.to,
      }));
  }, [data, accountId, decimals]);

  return {
    balanceHistory,
    loading,
    error,
  };
}
