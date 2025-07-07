import { useCallback, useMemo, useState } from "react";
import { useMyQueryQuery } from "@anticapture/graphql-client/hooks";
import { MyQueryQuery } from "@anticapture/graphql-client";
import { NetworkStatus } from "@apollo/client";
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
  refetch: () => void;
  fetchingMore: boolean;
}

export function useBalanceHistory(
  accountId: string,
  orderBy: string = "timestamp",
  orderDirection: "asc" | "desc" = "desc",
): UseBalanceHistoryResult {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  const {
    data,
    loading,
    error,
    refetch: originalRefetch,
    fetchMore,
    networkStatus,
  } = useMyQueryQuery({
    variables: {
      account: accountId,
      limit: itemsPerPage,
      orderBy,
      orderDirection,
    },
    context: {
      headers: {
        "anticapture-dao-id": "ENS",
      },
    },
    skip: !accountId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  // Transform raw transfers to our format
  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items.map(
      (transfer: NonNullable<MyQueryQuery["transfers"]["items"][0]>) => ({
        timestamp: transfer.timestamp?.toString() || "",
        amount: formatUnits(BigInt(transfer.amount || "0"), 18),
        fromAccountId: transfer.fromAccountId || null,
        toAccountId: transfer.toAccountId || null,
        transactionHash: transfer.transactionHash,
        direction: (transfer.fromAccountId === accountId ? "out" : "in") as
          | "in"
          | "out",
      }),
    );
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
          account: accountId,
          after: paginationInfo.endCursor,
          limit: itemsPerPage,
          orderBy,
          orderDirection,
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
    accountId,
    isPaginationLoading,
    itemsPerPage,
    orderBy,
    orderDirection,
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
          account: accountId,
          before: paginationInfo.startCursor,
          limit: itemsPerPage,
          orderBy,
          orderDirection,
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
    accountId,
    isPaginationLoading,
    itemsPerPage,
    orderBy,
    orderDirection,
  ]);

  const refetch = useCallback(() => {
    setCurrentPage(1);
    originalRefetch();
  }, [originalRefetch]);

  return {
    transfers: transformedTransfers,
    loading,
    error,
    paginationInfo,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
}
