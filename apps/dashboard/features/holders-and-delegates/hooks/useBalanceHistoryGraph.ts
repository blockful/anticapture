"use client";

import { formatUnits } from "viem";
import type { HistoricalBalancesPathParamsDaoEnumKey } from "@anticapture/client";
import { useHistoricalBalances } from "@anticapture/client/hooks";

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
      orderDirection: "desc",
    },
  );

  return {
    data: data?.items
      ? data.items
          .map((item) => ({
            ...item,
            timestamp: Number(item.timestamp) * 1000,
            balance: Number(formatUnits(item.balance, decimals)),
            direction: item.transfer.from === accountId ? "out" : "in",
            from: item.transfer.from,
            to: item.transfer.to,
            amount: Number(formatUnits(item.transfer.value, decimals)),
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
      : [],
    isLoading,
    error: !isLoading && Boolean(error),
  };
}
