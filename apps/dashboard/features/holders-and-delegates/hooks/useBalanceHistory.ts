"use client";

import type {
  OrderDirection,
  QueryInput_Transfers_OrderBy,
} from "@anticapture/graphql-client";
import type {
  BalanceHistoryQueryVariables,
  BalanceHistoryQuery,
} from "@anticapture/graphql-client/hooks";
import { useBalanceHistoryQuery } from "@anticapture/graphql-client/hooks";
import { useMemo, useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";

import type { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

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
  customFromFilter: string | null;
  customToFilter: string | null;
  orderBy?: "timestamp" | "amount";
  orderDirection?: "asc" | "desc";
  transactionType?: "all" | "buy" | "sell";
  filterVariables?: AmountFilterVariables;
  itemsPerPage?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    transactionType,
    orderBy,
    orderDirection,
    customFromFilter,
    customToFilter,
    filterVariables,
    fromTimestamp,
    toTimestamp,
  ]);

  const variables = useMemo(() => {
    const where: BalanceHistoryQueryVariables = {
      address: accountId,
      orderBy: orderBy as QueryInput_Transfers_OrderBy,
      orderDirection: orderDirection as OrderDirection,
      fromValue: filterVariables?.fromValue ?? null,
      toValue: filterVariables?.toValue ?? null,
      from: customFromFilter,
      to: customToFilter,
      skip: 0,
      fromDate: fromTimestamp ?? null,
      toDate: toTimestamp ?? null,
      limit,
    };

    switch (transactionType) {
      case "buy":
        where.to = accountId;
        break;

      case "sell":
        where.from = accountId;
        break;
    }

    return where;
  }, [
    accountId,
    transactionType,
    customFromFilter,
    customToFilter,
    filterVariables,
    orderBy,
    orderDirection,
    fromTimestamp,
    toTimestamp,
    limit,
  ]);

  const { data, error, loading, fetchMore } = useBalanceHistoryQuery({
    variables,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items
      .filter((t) => !!t)
      .map((transfer) => ({
        timestamp: transfer.timestamp.toString(),
        amount: Number(formatUnits(BigInt(transfer.amount), decimals)),
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        transactionHash: transfer.transactionHash,
        direction: (transfer.fromAccountId === accountId ? "out" : "in") as
          | "in"
          | "out",
      }));
  }, [data, accountId, decimals]);

  const hasNextPage = useMemo(() => {
    return currentPage * limit < (data?.transfers?.totalCount || 0);
  }, [currentPage, limit, data?.transfers?.totalCount]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isPaginationLoading) return;

    setIsPaginationLoading(true);

    const nextPage = currentPage + 1;

    try {
      await fetchMore({
        variables: {
          ...variables,
          skip: (nextPage - 1) * limit,
        },
        updateQuery: (
          previousResult: BalanceHistoryQuery,
          { fetchMoreResult }: { fetchMoreResult: BalanceHistoryQuery },
        ) => {
          if (!fetchMoreResult) return previousResult;

          return {
            transfers: {
              ...fetchMoreResult.transfers,
              items: [
                ...(previousResult.transfers?.items ?? []),
                ...(fetchMoreResult.transfers?.items ?? []),
              ],
              totalCount: fetchMoreResult?.transfers?.totalCount ?? 0,
            },
          };
        },
      });

      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    currentPage,
    limit,
    hasNextPage,
    isPaginationLoading,
    fetchMore,
    variables,
  ]);

  return {
    transfers: transformedTransfers,
    loading,
    error,
    fetchNextPage,
    hasNextPage,
    hasPreviousPage: currentPage > 1,
  };
}
