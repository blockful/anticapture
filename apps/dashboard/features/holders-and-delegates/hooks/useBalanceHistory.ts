import { formatUnits } from "viem";
import { useMemo, useState, useEffect, useCallback } from "react";

import {
  BalanceHistoryQueryVariables,
  Timestamp_Const,
  useBalanceHistoryQuery,
  BalanceHistoryQuery,
} from "@anticapture/graphql-client/hooks";

import { DaoIdEnum } from "@/shared/types/daos";
import { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";
import {
  QueryInput_Transfers_SortBy,
  QueryInput_Transfers_SortOrder,
} from "@anticapture/graphql-client";

export function useBalanceHistory({
  accountId,
  daoId,
  orderBy = Timestamp_Const.Timestamp,
  orderDirection = "desc",
  transactionType = "all",
  customFromFilter,
  customToFilter,
  filterVariables,
  limit = 10,
  decimals,
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
  ]);

  const variables = useMemo(() => {
    const where: BalanceHistoryQueryVariables = {
      address: accountId,
      sortBy: orderBy as QueryInput_Transfers_SortBy,
      sortOrder: orderDirection as QueryInput_Transfers_SortOrder,
      fromValue: filterVariables?.fromValue,
      toValue: filterVariables?.toValue,
      from: customFromFilter,
      to: customToFilter,
      offset: 0,
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
    limit,
  ]);

  const { data, error, loading, fetchMore } = useBalanceHistoryQuery({
    variables,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
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
    const offset = (nextPage - 1) * limit;

    try {
      await fetchMore({
        variables: {
          ...variables,
          offset,
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
