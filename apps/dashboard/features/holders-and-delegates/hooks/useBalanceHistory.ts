import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useBalanceHistoryQuery,
  useBalanceHistoryTotalCountQuery,
} from "@anticapture/graphql-client/hooks";
import { formatUnits } from "viem";
import { ApolloError, NetworkStatus } from "@apollo/client";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";

export interface Transfer {
  timestamp: string;
  amount: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  transactionHash: string;
  direction: "in" | "out";
}

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

export interface UseBalanceHistoryResult {
  transfers: Transfer[];
  loading: boolean;
  error?: ApolloError;
  paginationInfo: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
}

export function useBalanceHistory({
  accountId,
  daoId,
  orderBy = "timestamp",
  orderDirection = "desc",
  transactionType = "all",
  customFromFilter,
  customToFilter,
  filterVariables,
  itemsPerPage = 10,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  transactionType?: "all" | "buy" | "sell";
  customFromFilter?: string;
  customToFilter?: string;
  filterVariables?: AmountFilterVariables;
  itemsPerPage?: number;
}): UseBalanceHistoryResult {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const {
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

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

  const { fromFilter, toFilter } = useMemo(() => {
    if (customToFilter && customToFilter !== accountId) {
      return {
        fromFilter: accountId,
        toFilter: customToFilter,
      };
    }

    if (customFromFilter && customFromFilter !== accountId) {
      return {
        fromFilter: customFromFilter,
        toFilter: accountId,
      };
    }

    if (transactionType === "buy") {
      return {
        fromFilter: undefined,
        toFilter: accountId,
      };
    }

    if (transactionType === "sell") {
      return {
        fromFilter: accountId,
        toFilter: undefined,
      };
    }

    return {
      fromFilter: accountId,
      toFilter: accountId,
    };
  }, [accountId, transactionType, customFromFilter, customToFilter]);

  const queryVariables = useMemo(
    () => ({
      from: fromFilter,
      to: toFilter,
      limit: itemsPerPage,
      orderBy,
      orderDirection,
      ...filterVariables,
    }),
    [
      fromFilter,
      toFilter,
      itemsPerPage,
      orderBy,
      orderDirection,
      filterVariables,
    ],
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

  const { data, networkStatus, error, fetchMore } = useBalanceHistoryQuery({
    variables: queryVariables,
    ...queryOptions,
  });

  const { data: totalCountData } = useBalanceHistoryTotalCountQuery({
    variables: { account: accountId },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    fetchPolicy: "cache-first" as const,
  });

  // Transform raw transfers to our format
  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items.map((transfer) => ({
      timestamp: transfer.timestamp?.toString() || "",
      amount:
        token === "ERC20"
          ? formatUnits(BigInt(transfer.amount || "0"), 18)
          : (transfer.amount || "0").toString(),
      fromAccountId: transfer.fromAccountId || null,
      toAccountId: transfer.toAccountId || null,
      transactionHash: transfer.transactionHash,
      direction: (transfer.fromAccountId === accountId ? "out" : "in") as
        | "in"
        | "out",
    }));
  }, [data, accountId, token]);

  // Pagination info
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

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (
      !paginationInfo.hasNextPage ||
      !paginationInfo.endCursor ||
      isPaginationLoading
    ) {
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

  // Fetch previous page
  const fetchPreviousPage = useCallback(async () => {
    if (
      !paginationInfo.hasPreviousPage ||
      !paginationInfo.startCursor ||
      isPaginationLoading
    ) {
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

  const isLoading = useMemo(() => {
    return (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus]);

  return {
    transfers: transformedTransfers,
    loading: isLoading,
    error,
    paginationInfo,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
}
