"use client";

import type { HistoricalBalancesPathParamsDaoEnumKey } from "@anticapture/client";
import { useHistoricalBalances } from "@anticapture/client/hooks";
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
  data: BalanceHistoryGraphItem[];
  isLoading: boolean;
  error: boolean;
} {
  const { decimals } = daoConfig[daoId];

  const { data, isLoading, error } = useHistoricalBalances(
    daoId.toLowerCase() as HistoricalBalancesPathParamsDaoEnumKey,
    accountId,
    {
      fromDate,
      fromValue: "1",
      limit: 1000,
      orderBy: "timestamp",
      orderDirection: "asc",
    },
  );

  const balanceHistory = useMemo(() => {
    if (!data?.items) return [];

    return data.items
      .filter((item) => !!item)
      .map((item) => ({
        ...item,
        timestamp: Number(item.timestamp) * 1000,
        balance: Number(formatUnits(BigInt(item.balance), decimals)),
        direction: item.transfer.from === accountId ? "out" : "in",
        from: item.transfer.from,
        to: item.transfer.to,
        amount: Number(formatUnits(BigInt(item.transfer.value), decimals)),
      }));
  }, [data, accountId, decimals]);

  return {
    data: balanceHistory,
    isLoading,
    error: !isLoading && Boolean(error),
  };
}
