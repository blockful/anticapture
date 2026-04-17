"use client";

import {
  OrderDirection,
  QueryInput_HistoricalBalances_OrderBy,
} from "@anticapture/graphql-client";
import { useBalanceHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { useMemo } from "react";
import { formatUnits } from "viem";

import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface BalanceHistoryGraphItem {
  timestamp: number;
  balance: number;
  from: string | null;
  to: string | null;
  amount: number;
  transactionHash: string;
  direction: string;
  logIndex: number;
}

export function useBalanceHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  fromDate?: number,
): {
  balanceHistory: BalanceHistoryGraphItem[];
  loading: boolean;
  error: boolean;
} {
  const { decimals } = daoConfig[daoId];

  const { data, loading, error } = useBalanceHistoryGraphQuery({
    variables: {
      address: accountId,
      fromDate: fromDate ?? null,
      orderBy: QueryInput_HistoricalBalances_OrderBy.Timestamp,
      orderDirection: OrderDirection.Desc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  const balanceHistory = useMemo(() => {
    if (!data?.historicalBalances?.items) return [];

    return data.historicalBalances.items
      .filter((item) => !!item)
      .map((item) => ({
        ...item,
        timestamp: Number(item.timestamp) * 1000,
        balance: Number(formatUnits(BigInt(item.balance), decimals)),
        direction: item.transfer.from === accountId ? "out" : "in",
        from: item.transfer.from,
        to: item.transfer.to,
        amount: Number(formatUnits(BigInt(item.transfer.value), decimals)),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, accountId, decimals]);

  return {
    balanceHistory,
    loading,
    error: !!error,
  };
}
