"use client";

import {
  QueryInput_AccountBalances_OrderBy,
  QueryInput_AccountBalances_OrderDirection,
} from "@anticapture/graphql-client";
import { useGetTokenHoldersQuery } from "@anticapture/graphql-client/hooks";
import { NetworkStatus } from "@apollo/client";
import { useMemo, useCallback, useState } from "react";

import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

export interface TokenHolderVariation {
  previousBalance: string;
  absoluteChange: string;
  percentageChange: string;
}

export interface TokenHolder {
  accountId: string;
  balance: string;
  delegate: string;
  tokenId: string;
  variation: TokenHolderVariation | null;
}

interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor?: string | null;
  startCursor?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  currentItemsCount: number;
}

interface UseTokenHoldersResult {
  data: TokenHolder[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
}

interface UseTokenHoldersParams {
  daoId: DaoIdEnum;
  address?: string;
  orderBy?: QueryInput_AccountBalances_OrderBy;
  orderDirection?: QueryInput_AccountBalances_OrderDirection;
  limit?: number;
  days: TimeInterval;
}

export const useTokenHolders = ({
  daoId,
  orderBy = QueryInput_AccountBalances_OrderBy.Balance,
  orderDirection = QueryInput_AccountBalances_OrderDirection.Desc,
  limit = 10,
  address,
  days,
}: UseTokenHoldersParams): UseTokenHoldersResult => {
  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);

  const fromDate = useMemo(() => {
    return (Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days]).toString();
  }, [days]);

  const {
    data: tokenHoldersData,
    error: tokenHoldersError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetTokenHoldersQuery({
    variables: {
      limit,
      skip: 0,
      orderDirection,
      orderBy,
      fromDate,
      ...(address && { addresses: [address] }),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const processedData = useMemo(() => {
    if (!tokenHoldersData?.accountBalances?.items) return null;

    return tokenHoldersData.accountBalances.items
      .filter((holder) => holder !== null)
      .map((holder) => ({
        accountId: holder.address,
        balance: holder.balance,
        delegate: holder.delegate,
        tokenId: holder.tokenId,
        variation: holder.variation
          ? {
              previousBalance: holder.variation.previousBalance,
              absoluteChange: holder.variation.absoluteChange,
              percentageChange: holder.variation.percentageChange,
            }
          : null,
      }));
  }, [tokenHoldersData]);

  // Pagination info - combines GraphQL data with our page tracking
  const pagination = useMemo<PaginationInfo>(() => {
    const totalCount = tokenHoldersData?.accountBalances?.totalCount || 0;
    const currentItemsCount =
      tokenHoldersData?.accountBalances?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      endCursor: null,
      startCursor: null,
      totalCount,
      currentPage,
      totalPages,
      limit,
      currentItemsCount,
    };
  }, [
    tokenHoldersData?.accountBalances?.totalCount,
    tokenHoldersData?.accountBalances?.items?.length,
    currentPage,
    limit,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      // Calculate skip based on current loaded items count
      const currentItemsCount =
        tokenHoldersData?.accountBalances?.items?.length || 0;
      const skip = currentItemsCount;

      await fetchMore({
        variables: {
          limit,
          skip,
          orderDirection,
          orderBy,
          fromDate,
          ...(address && { addresses: [address] }),
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.accountBalances) return previousResult;

          // Append new items to existing ones (infinite scroll)
          const prevItems = previousResult.accountBalances?.items ?? [];
          const newItems = fetchMoreResult.accountBalances.items ?? [];

          // Filter out duplicates based on accountId
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) => n && !prevItems.some((p) => p?.address === n.address),
            ),
          ];

          return {
            ...fetchMoreResult,
            accountBalances: {
              ...fetchMoreResult.accountBalances,
              items: merged,
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
    limit,
    orderDirection,
    orderBy,
    fromDate,
    address,
    isPaginationLoading,
    tokenHoldersData?.accountBalances?.items?.length,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (!pagination.hasPreviousPage || isPaginationLoading) {
      console.warn("No previous page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      // Calculate skip for the previous page
      const skip = (currentPage - 2) * limit;

      await fetchMore({
        variables: {
          limit,
          skip,
          orderDirection,
          orderBy,
          fromDate,
          ...(address && { addresses: [address] }),
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.accountBalances) return previousResult;

          // Replace the current data with the new page data
          return {
            ...fetchMoreResult,
            accountBalances: {
              ...fetchMoreResult.accountBalances,
              items: fetchMoreResult.accountBalances.items,
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
    limit,
    orderDirection,
    orderBy,
    fromDate,
    address,
    isPaginationLoading,
    currentPage,
  ]);

  // Enhanced refetch that resets pagination
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const isLoading = useMemo(() => {
    return (
      (networkStatus === NetworkStatus.loading && !processedData?.length) ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus, processedData]);

  return {
    data: processedData,
    loading: isLoading,
    error: tokenHoldersError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
};
