import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useBalanceHistoryQuery,
  useBalanceHistoryBuyQuery,
  useBalanceHistorySellQuery,
  useBalanceHistoryTotalCountQuery,
  useBalanceHistoryBuyTotalCountQuery,
  useBalanceHistorySellTotalCountQuery,
} from "@anticapture/graphql-client/hooks";

import { formatUnits } from "viem";
import { ApolloError, NetworkStatus } from "@apollo/client";

// Interface for a single transfer
export interface Transfer {
  timestamp: string;
  amount: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  transactionHash: string;
  direction: "in" | "out";
}

// Interface for pagination info
export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

// Interface for the hook result
export interface UseBalanceHistoryResult {
  transfers: Transfer[];
  loading: boolean;
  error?: ApolloError;
  paginationInfo: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
}

export function useBalanceHistory(
  accountId: string,
  daoId: string,
  orderBy: string = "timestamp",
  orderDirection: "asc" | "desc" = "desc",
  transactionType: "all" | "buy" | "sell" = "all",
): UseBalanceHistoryResult {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Reset page to 1 when transaction type or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [transactionType, orderBy, orderDirection]);

  const queryVariables = useMemo(
    () => ({
      account: accountId,
      limit: itemsPerPage,
      orderBy,
      orderDirection,
    }),
    [accountId, itemsPerPage, orderBy, orderDirection],
  );

  const queryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network" as const,
  };

  // Use different queries based on transaction type
  const allQuery = useBalanceHistoryQuery({
    variables: queryVariables,
    ...queryOptions,
    skip: !accountId || transactionType !== "all",
  });

  const buyQuery = useBalanceHistoryBuyQuery({
    variables: queryVariables,
    ...queryOptions,
    skip: !accountId || transactionType !== "buy",
  });

  const sellQuery = useBalanceHistorySellQuery({
    variables: queryVariables,
    ...queryOptions,
    skip: !accountId || transactionType !== "sell",
  });

  // Use separate totalCount queries (called only once or when filters change)
  const totalCountQueryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    fetchPolicy: "cache-first" as const, // Use cache-first for totalCount to reduce calls
  };

  const allTotalCountQuery = useBalanceHistoryTotalCountQuery({
    variables: { account: accountId },
    ...totalCountQueryOptions,
    skip: !accountId || transactionType !== "all",
  });

  const buyTotalCountQuery = useBalanceHistoryBuyTotalCountQuery({
    variables: { account: accountId },
    ...totalCountQueryOptions,
    skip: !accountId || transactionType !== "buy",
  });

  const sellTotalCountQuery = useBalanceHistorySellTotalCountQuery({
    variables: { account: accountId },
    ...totalCountQueryOptions,
    skip: !accountId || transactionType !== "sell",
  });

  // Select the active queries based on transaction type
  const activeQuery =
    transactionType === "buy"
      ? buyQuery
      : transactionType === "sell"
        ? sellQuery
        : allQuery;

  const activeTotalCountQuery =
    transactionType === "buy"
      ? buyTotalCountQuery
      : transactionType === "sell"
        ? sellTotalCountQuery
        : allTotalCountQuery;

  const { data, loading, error, fetchMore } = activeQuery;
  const { data: totalCountData, networkStatus } = activeTotalCountQuery;

  // Transform raw transfers to our format
  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items.map((transfer) => ({
      timestamp: transfer.timestamp?.toString() || "",
      amount: formatUnits(BigInt(transfer.amount || "0"), 18),
      fromAccountId: transfer.fromAccountId || null,
      toAccountId: transfer.toAccountId || null,
      transactionHash: transfer.transactionHash,
      direction: (transfer.fromAccountId === accountId ? "out" : "in") as
        | "in"
        | "out",
    }));
  }, [data, accountId]);

  // Real pagination info from GraphQL query
  const paginationInfo: PaginationInfo = useMemo(() => {
    const pageInfo = data?.transfers?.pageInfo;
    const totalCount = totalCountData?.transfers?.totalCount || 0;
    const currentItemsCount = data?.transfers?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage: pageInfo?.hasNextPage ?? false,
      hasPreviousPage: pageInfo?.hasPreviousPage ?? false,
      endCursor: pageInfo?.endCursor,
      startCursor: pageInfo?.startCursor,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [
    data?.transfers?.pageInfo,
    totalCountData?.transfers?.totalCount,
    data?.transfers?.items?.length,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (
      !paginationInfo.hasNextPage ||
      !paginationInfo.endCursor ||
      isPaginationLoading
    ) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          after: paginationInfo.endCursor,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;
          const prevItems = previousResult.transfers.items ?? [];
          const newItems = fetchMoreResult.transfers.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) =>
                !prevItems.some((p) => p.transactionHash === n.transactionHash),
            ),
          ];

          return {
            ...fetchMoreResult,
            transfers: {
              ...fetchMoreResult.transfers,
              items: merged,
            },
          };
        },
      });

      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    paginationInfo.hasNextPage,
    paginationInfo.endCursor,
    isPaginationLoading,
    queryVariables,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (
      !paginationInfo.hasPreviousPage ||
      !paginationInfo.startCursor ||
      isPaginationLoading
    ) {
      console.warn("No previous page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          before: paginationInfo.startCursor,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;
          const prevItems = previousResult.transfers.items ?? [];
          const newItems = fetchMoreResult.transfers.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) =>
                !prevItems.some((p) => p.transactionHash === n.transactionHash),
            ),
          ];

          return {
            ...fetchMoreResult,
            transfers: {
              ...fetchMoreResult.transfers,
              items: merged,
            },
          };
        },
      });

      setCurrentPage((prev) => prev - 1);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    paginationInfo.hasPreviousPage,
    paginationInfo.startCursor,
    isPaginationLoading,
    queryVariables,
  ]);

  return {
    transfers: transformedTransfers,
    loading,
    error,
    paginationInfo,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
}
