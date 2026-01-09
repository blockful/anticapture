import { formatUnits } from "viem";
import { useMemo, useState, useEffect, useCallback } from "react";

import {
  BalanceHistoryQueryVariables,
  Timestamp_Const,
  QueryInput_Transfers_SortOrder,
  useBalanceHistoryQuery,
  QueryInput_Transfers_SortBy,
  BalanceHistoryQuery,
} from "@anticapture/graphql-client/hooks";

import { DaoIdEnum } from "@/shared/types/daos";
import { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";

export function useBalanceHistory({
  accountId,
  daoId,
  orderBy = Timestamp_Const.Timestamp,
  orderDirection = QueryInput_Transfers_SortOrder.Desc,
  transactionType = "all",
  customFromFilter,
  customToFilter,
  filterVariables,
  itemsPerPage = 10,
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
  itemsPerPage?: number;
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
  ]);

  const variables = useMemo(() => {
    const where: BalanceHistoryQueryVariables = {
      address: accountId,
      sortBy: orderBy as QueryInput_Transfers_SortBy,
      sortOrder: orderDirection as QueryInput_Transfers_SortOrder,
      fromValue: filterVariables?.minDelta,
      toValue: filterVariables?.maxDelta,
      from: customFromFilter,
      to: customToFilter,
      offset: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
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
    currentPage,
    itemsPerPage,
  ]);

  const { data, error, loading, fetchMore } = useBalanceHistoryQuery({
    variables,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  // Transform raw transfers to our format
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
    return currentPage * itemsPerPage < (data?.transfers?.totalCount || 0);
  }, [currentPage, itemsPerPage, data?.transfers?.totalCount]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isPaginationLoading) {
      return;
    }

    setIsPaginationLoading(true);

    try {
      setCurrentPage((prev) => prev + 1);

      await fetchMore({
        variables: {
          ...variables,
          currentPage,
          offset: currentPage * itemsPerPage,
        },
        updateQuery: (
          previousResult: BalanceHistoryQuery,
          { fetchMoreResult }: { fetchMoreResult: BalanceHistoryQuery },
        ) => {
          const prevItems = previousResult?.transfers?.items ?? [];
          const newItems = fetchMoreResult?.transfers?.items ?? [];

          return {
            transfers: {
              items: [...prevItems, ...newItems],
              totalCount: fetchMoreResult?.transfers?.totalCount ?? 0,
            },
          };
        },
      });
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    isPaginationLoading,
    hasNextPage,
    currentPage,
    itemsPerPage,
    variables,
    fetchMore,
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
