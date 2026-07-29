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

/**
 * Balances at the two edges of the selected period, read straight from the API
 * instead of from the rows the graph plots. The graph query hides sub-token
 * transfers and keeps only the newest 1,000 rows, so its first row is not the
 * period's opening balance for an active account: a limit-1 lookup on either
 * side of the boundary is.
 */
export function useBalanceHistoryBoundaries(
  accountId: string,
  daoId: DaoIdEnum,
  fromDate?: number,
): { startingBalance: number; endingBalance: number; isLoading: boolean } {
  const { decimals } = daoConfig[daoId];
  const dao = daoId.toLowerCase() as HistoricalBalancesPathParamsDaoEnumKey;

  // The last transfer strictly before the period: its running balance is what
  // the address held when the period opened. No row means it held nothing.
  const { data: openingData, isLoading: openingLoading } =
    useHistoricalBalances(
      dao,
      accountId,
      {
        toDate: fromDate ? fromDate - 1 : undefined,
        limit: 1,
        orderBy: "timestamp",
        orderDirection: "desc",
      },
      { query: { enabled: Boolean(accountId && fromDate) } },
    );

  const { data: closingData, isLoading: closingLoading } =
    useHistoricalBalances(
      dao,
      accountId,
      { limit: 1, orderBy: "timestamp", orderDirection: "desc" },
      { query: { enabled: Boolean(accountId) } },
    );

  const toBalance = (raw?: bigint | string) =>
    raw === undefined ? 0 : Number(formatUnits(BigInt(raw), decimals));

  return {
    startingBalance: fromDate ? toBalance(openingData?.items?.[0]?.balance) : 0,
    endingBalance: toBalance(closingData?.items?.[0]?.balance),
    isLoading: (fromDate ? openingLoading : false) || closingLoading,
  };
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
