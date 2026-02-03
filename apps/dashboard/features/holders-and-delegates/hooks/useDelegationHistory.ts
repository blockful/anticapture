"use client";

import { useGetDelegationHistoryItemsQuery } from "@anticapture/graphql-client/hooks";
import {
  GetDelegationHistoryItemsQuery,
  QueryInput_HistoricalDelegations_OrderDirection,
} from "@anticapture/graphql-client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  AmountFilterVariables,
  PaginationInfo,
} from "@/features/holders-and-delegates/hooks/types";

interface UseDelegationHistoryResult {
  data:
    | NonNullable<
        GetDelegationHistoryItemsQuery["historicalDelegations"]
      >["items"]
    | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
}

interface UseDelegationHistoryParams {
  delegatorAccountId: string;
  delegateAccountId?: string;
  daoId: DaoIdEnum;
  orderBy?: string;
  orderDirection?: string;
  filterVariables?: AmountFilterVariables;
  limit?: number;
}

export const useDelegationHistory = ({
  delegatorAccountId,
  delegateAccountId,
  daoId,
  orderBy = "timestamp",
  orderDirection = "desc",
  filterVariables,
  limit = 15,
}: UseDelegationHistoryParams): UseDelegationHistoryResult => {
  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState(1);

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  const {
    data: delegationHistoryData,
    error: itemsError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetDelegationHistoryItemsQuery({
    variables: {
      delegator: delegatorAccountId,
      skip: (currentPage - 1) * limit,
      limit,
      orderDirection:
        orderDirection === "asc"
          ? QueryInput_HistoricalDelegations_OrderDirection.Asc
          : QueryInput_HistoricalDelegations_OrderDirection.Desc,
      ...(delegateAccountId && { delegate: [delegateAccountId] }),
      ...(filterVariables?.fromValue && {
        fromValue: filterVariables.fromValue.toString(),
      }),
      ...(filterVariables?.toValue && {
        toValue: filterVariables.toValue.toString(),
      }),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always check network for fresh data
  });

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    setCurrentPage(1);
    refetch({
      skip: 0,
      limit,
      orderDirection:
        orderDirection === "asc"
          ? QueryInput_HistoricalDelegations_OrderDirection.Asc
          : QueryInput_HistoricalDelegations_OrderDirection.Desc,
    });
  }, [orderDirection, refetch, limit]);

  const processedData = useMemo(() => {
    return (
      delegationHistoryData?.historicalDelegations?.items?.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      ) ?? []
    );
  }, [delegationHistoryData]);

  const pagination = useMemo<PaginationInfo>(() => {
    const totalCount =
      delegationHistoryData?.historicalDelegations?.totalCount || 0;
    const currentItemsCount =
      delegationHistoryData?.historicalDelegations?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      hasNextPage,
      hasPreviousPage,
      endCursor: undefined,
      startCursor: undefined,
      totalCount,
      currentPage,
      totalPages,
      limit,
      currentItemsCount,
    };
  }, [
    delegationHistoryData?.historicalDelegations?.items?.length,
    delegationHistoryData?.historicalDelegations?.totalCount,
    currentPage,
    limit,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) {
      console.warn("No next page available");
      return;
    }

    setIsPaginationLoading(true);

    try {
      const skip = currentPage * limit;
      await fetchMore({
        variables: {
          delegator: delegatorAccountId,
          skip,
          limit,
          orderDirection:
            orderDirection === "asc"
              ? QueryInput_HistoricalDelegations_OrderDirection.Asc
              : QueryInput_HistoricalDelegations_OrderDirection.Desc,
          ...(delegateAccountId && { delegate: [delegateAccountId] }),
          ...(filterVariables?.fromValue && {
            fromValue: filterVariables.fromValue.toString(),
          }),
          ...(filterVariables?.toValue && {
            toValue: filterVariables.toValue.toString(),
          }),
        },
        updateQuery: (
          previousResult: GetDelegationHistoryItemsQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult?: GetDelegationHistoryItemsQuery },
        ) => {
          if (!fetchMoreResult?.historicalDelegations) return previousResult;
          const prevItems =
            previousResult.historicalDelegations?.items?.filter(
              (item): item is NonNullable<typeof item> => item !== null,
            ) ?? [];
          const newItems =
            fetchMoreResult.historicalDelegations.items?.filter(
              (item): item is NonNullable<typeof item> => item !== null,
            ) ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) => !prevItems.some((p) => p.timestamp === n.timestamp),
            ),
          ];
          return {
            ...fetchMoreResult,
            historicalDelegations: {
              ...fetchMoreResult.historicalDelegations,
              items: merged,
              totalCount: fetchMoreResult.historicalDelegations.totalCount ?? 0,
            },
          };
        },
      });
      // Update page number after successful fetch
      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    currentPage,
    limit,
    orderDirection,
    delegatorAccountId,
    delegateAccountId,
    filterVariables,
    isPaginationLoading,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (!pagination.hasPreviousPage || isPaginationLoading) {
      console.warn("No previous page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      const skip = Math.max(0, (currentPage - 2) * limit);
      await fetchMore({
        variables: {
          delegator: delegatorAccountId,
          skip,
          limit,
          orderDirection:
            orderDirection === "asc"
              ? QueryInput_HistoricalDelegations_OrderDirection.Asc
              : QueryInput_HistoricalDelegations_OrderDirection.Desc,
          ...(delegateAccountId && { delegate: [delegateAccountId] }),
          ...(filterVariables?.fromValue && {
            fromValue: filterVariables.fromValue.toString(),
          }),
          ...(filterVariables?.toValue && {
            toValue: filterVariables.toValue.toString(),
          }),
        },
        updateQuery: (
          previousResult: GetDelegationHistoryItemsQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult?: GetDelegationHistoryItemsQuery },
        ) => {
          if (!fetchMoreResult?.historicalDelegations) return previousResult;
          // Replace the current data with the new page data
          return {
            ...fetchMoreResult,
            historicalDelegations: {
              ...fetchMoreResult.historicalDelegations,
              items: fetchMoreResult.historicalDelegations.items,
              totalCount: fetchMoreResult.historicalDelegations.totalCount ?? 0,
            },
          };
        },
      });

      // Update page number after successful fetch
      setCurrentPage((prev) => prev - 1);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasPreviousPage,
    currentPage,
    limit,
    orderDirection,
    delegatorAccountId,
    delegateAccountId,
    filterVariables,
    isPaginationLoading,
  ]);

  // Enhanced refetch that resets pagination
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const isLoading = useMemo(() => {
    return (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus]);

  return {
    data: processedData,
    loading: isLoading,
    error: itemsError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
};
