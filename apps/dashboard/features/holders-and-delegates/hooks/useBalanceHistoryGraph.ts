import { useMemo } from "react";
import { formatUnits } from "viem";

import {
  QueryInput_Transfers_SortBy,
  QueryInput_Transfers_SortOrder,
  useBalanceHistoryGraphQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";

export interface BalanceHistoryGraphItem {
  timestamp: number;
  amount: number;
  fromAccountId: string | null;
  toAccountId: string | null;
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
      fromDate,
      sortBy: QueryInput_Transfers_SortBy.Timestamp,
      sortOrder: QueryInput_Transfers_SortOrder.Asc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const balanceHistory = useMemo((): BalanceHistoryGraphItem[] => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items
      .filter((item) => !!item)
      .map((item) => ({
        ...item,
        timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
        amount: Number(formatUnits(BigInt(item.amount), decimals)),
        direction: item.fromAccountId === accountId ? "out" : "in",
      }));
  }, [data, accountId, decimals]);

  return {
    balanceHistory,
    loading,
    error,
  };
}
