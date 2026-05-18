"use client";

import type {
  HistoricalDelegationsPathParamsDaoEnumKey,
  HistoricalDelegationsQueryResponse,
} from "@anticapture/client";
import { useHistoricalDelegationsInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/types";
import type { DaoIdEnum } from "@/shared/types/daos";

interface UseDelegationHistoryParams {
  delegatorAccountId: string;
  delegateAccountId?: string;
  daoId: DaoIdEnum;
  orderDirection?: "asc" | "desc";
  filterVariables?: AmountFilterVariables;
  limit?: number;
}

const getNextPageParam = (
  lastPage: HistoricalDelegationsQueryResponse,
  allPages: HistoricalDelegationsQueryResponse[],
): number | undefined => {
  const loaded = allPages.reduce((s, p) => s + p.items.length, 0);
  return loaded >= lastPage.totalCount ? undefined : loaded;
};

export const useDelegationHistory = ({
  delegatorAccountId,
  delegateAccountId,
  daoId,
  orderDirection = "desc",
  filterVariables,
  limit = 15,
}: UseDelegationHistoryParams) => {
  const params = useMemo(
    () => ({
      ...(delegateAccountId ? { delegateAddressIn: [delegateAccountId] } : {}),
      orderDirection,
      ...(filterVariables?.fromValue
        ? { fromValue: filterVariables.fromValue }
        : {}),
      ...(filterVariables?.toValue ? { toValue: filterVariables.toValue } : {}),
      limit,
    }),
    [delegateAccountId, orderDirection, filterVariables, limit],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHistoricalDelegationsInfinite(
    daoId.toLowerCase() as HistoricalDelegationsPathParamsDaoEnumKey,
    delegatorAccountId,
    params,
    { query: { getNextPageParam } },
  );

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  return {
    data: items,
    loading: isLoading,
    error: error ?? null,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
  };
};
