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
  error: unknown;
  paginationInfo: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  isLoadingMore: boolean;
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
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);

  // Reset page to 1 and clear accumulated data when transaction type or sorting changes
  useEffect(() => {
    setCurrentPage(1);
    setAllTransfers([]);
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
  const { data: totalCountData } = activeTotalCountQuery;

  // Transform raw transfers to our format
  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items.map((transfer: Record<string, unknown>) => ({
      timestamp: transfer.timestamp?.toString() || "",
      amount: formatUnits(BigInt((transfer.amount as string) || "0"), 18),
      fromAccountId: (transfer.fromAccountId as string) || null,
      toAccountId: (transfer.toAccountId as string) || null,
      transactionHash: transfer.transactionHash as string,
      direction: (transfer.fromAccountId === accountId ? "out" : "in") as
        | "in"
        | "out",
    }));
  }, [data, accountId]);

  // Update accumulated transfers when new data comes in
  useEffect(() => {
    if (transformedTransfers.length > 0 && currentPage === 1) {
      // For first page, replace all transfers
      setAllTransfers(transformedTransfers);
    } else if (transformedTransfers.length > 0 && currentPage > 1) {
      // For subsequent pages, append transfers (avoid duplicates)
      setAllTransfers((prev) => {
        const existingHashes = new Set(prev.map((t) => t.transactionHash));
        const newTransfers = transformedTransfers.filter(
          (t) => !existingHashes.has(t.transactionHash),
        );
        return [...prev, ...newTransfers];
      });
    }
  }, [transformedTransfers, currentPage]);

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
        updateQuery: (
          previousResult: Record<string, unknown>,
          { fetchMoreResult }: { fetchMoreResult: Record<string, unknown> },
        ) => {
          if (!fetchMoreResult) return previousResult;

          // For infinite scroll, we need to merge the data
          const prevItems =
            ((previousResult?.transfers as Record<string, unknown>)
              ?.items as unknown[]) || [];
          const newItems =
            ((fetchMoreResult.transfers as Record<string, unknown>)
              ?.items as unknown[]) || [];

          return {
            ...fetchMoreResult,
            transfers: {
              ...fetchMoreResult.transfers,
              items: [...prevItems, ...newItems],
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

  return {
    transfers: allTransfers,
    loading,
    error,
    paginationInfo,
    fetchNextPage,
    isLoadingMore: isPaginationLoading,
  };
}
