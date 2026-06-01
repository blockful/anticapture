"use client";

import {
  getNextPageParam,
  type HistoricalBalancesPathParamsDaoEnumKey,
  type HistoricalBalancesQueryParamsOrderByEnumKey,
} from "@anticapture/client";
import { useHistoricalBalancesInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";
import { formatUnits } from "viem";

import type { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/types";
import type { DaoIdEnum } from "@/shared/types/daos";

export function useBalanceHistory({
  accountId,
  daoId,
  orderBy = "timestamp",
  orderDirection = "desc",
  transactionType = "all",
  customFromFilter,
  customToFilter,
  filterVariables,
  limit = 10,
  decimals,
  fromTimestamp,
  toTimestamp,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  decimals: number;
  customFromFilter?: string | null;
  customToFilter?: string | null;
  orderBy?: "timestamp" | "amount";
  orderDirection?: "asc" | "desc";
  transactionType?: "all" | "buy" | "sell";
  filterVariables?: AmountFilterVariables;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
}) {
  const restOrderBy: HistoricalBalancesQueryParamsOrderByEnumKey =
    orderBy === "amount" ? "delta" : "timestamp";

  const fromFilter =
    transactionType === "sell" ? accountId : (customFromFilter ?? undefined);
  const toFilter =
    transactionType === "buy" ? accountId : (customToFilter ?? undefined);

  const params = useMemo(
    () => ({
      orderBy: restOrderBy,
      orderDirection,
      ...(filterVariables?.fromValue
        ? { fromValue: filterVariables.fromValue }
        : {}),
      ...(filterVariables?.toValue ? { toValue: filterVariables.toValue } : {}),
      ...(fromTimestamp ? { fromDate: fromTimestamp } : {}),
      ...(toTimestamp ? { toDate: toTimestamp } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      limit,
    }),
    [
      restOrderBy,
      orderDirection,
      filterVariables,
      fromTimestamp,
      toTimestamp,
      fromFilter,
      toFilter,
      limit,
    ],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHistoricalBalancesInfinite(
    daoId.toLowerCase() as HistoricalBalancesPathParamsDaoEnumKey,
    accountId,
    params,
    { query: { getNextPageParam } },
  );

  const transformedData = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .flatMap((p) => p.items)
      .map((item) => ({
        timestamp: item.timestamp.toString(),
        amount: Number(formatUnits(BigInt(item.transfer.value), decimals)),
        fromAccountId: item.transfer.from,
        toAccountId: item.transfer.to,
        transactionHash: item.transactionHash,
        direction: (item.transfer.from === accountId ? "out" : "in") as
          | "in"
          | "out",
      }));
  }, [data, accountId, decimals]);

  return {
    data: transformedData,
    loading: isLoading,
    error: error ?? null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchingMore: isFetchingNextPage,
  };
}
