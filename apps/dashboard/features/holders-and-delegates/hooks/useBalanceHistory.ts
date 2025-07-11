import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useMyQueryQuery,
  useMyQueryBuyQuery,
  useMyQuerySellQuery,
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
  error: any;
  paginationInfo: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
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

  const queryVariables = {
    account: accountId,
    limit: itemsPerPage,
    orderBy,
    orderDirection,
  };

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
  const allQuery = useMyQueryQuery({
    variables: queryVariables,
    ...queryOptions,
    skip: !accountId || transactionType !== "all",
  });

  const buyQuery = useMyQueryBuyQuery({
    variables: queryVariables,
    ...queryOptions,
    skip: !accountId || transactionType !== "buy",
  });

  const sellQuery = useMyQuerySellQuery({
    variables: queryVariables,
    ...queryOptions,
    skip: !accountId || transactionType !== "sell",
  });

  // Select the active query based on transaction type
  const activeQuery =
    transactionType === "buy"
      ? buyQuery
      : transactionType === "sell"
        ? sellQuery
        : allQuery;

  const { data, loading, error, fetchMore } = activeQuery;

  // Transform raw transfers to our format
  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items.map((transfer: any) => ({
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
    const totalCount = data?.transfers?.totalCount || 0;
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
    data?.transfers?.totalCount,
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

          return {
            ...fetchMoreResult,
            transfers: {
              ...fetchMoreResult.transfers,
              items: fetchMoreResult.transfers.items,
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

          return {
            ...fetchMoreResult,
            transfers: {
              ...fetchMoreResult.transfers,
              items: fetchMoreResult.transfers.items,
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
  };
}
