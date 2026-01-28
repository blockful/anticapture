"use client";

import { useGetTopTokenHoldersQuery } from "@anticapture/graphql-client/hooks";
import { QueryInput_AccountBalances_OrderDirection } from "@anticapture/graphql-client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { useHistoricalBalances } from "@/shared/hooks/graphql-client/useHistoricalBalances";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

export interface TokenHolder {
  accountId: string;
  balance: string;
  delegate: string;
  tokenId: string;
  account?: {
    type: string;
  } | null;
}

interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor?: string | null;
  startCursor?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
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
  isHistoricalLoadingFor: (address: string) => boolean;
  historicalBalancesCache: Map<string, string>;
}

interface UseTokenHoldersParams {
  daoId: DaoIdEnum;
  address: string | null;
  orderBy?: string;
  orderDirection?: QueryInput_AccountBalances_OrderDirection;
  limit?: number;
  days: TimeInterval;
}

export const useTokenHolders = ({
  daoId,
  orderBy = "balance",
  orderDirection = QueryInput_AccountBalances_OrderDirection.Desc,
  limit = 10,
  address,
  days,
}: UseTokenHoldersParams): UseTokenHoldersResult => {
  const itemsPerPage = limit;

  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [historicalBalancesCache, setHistoricalBalancesCache] = useState<
    Map<string, string>
  >(new Map());

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
    setHistoricalBalancesCache(new Map());
  }, [orderBy, orderDirection, address]);

  // Clear historical balances cache when days changes to refetch it
  useEffect(() => {
    setHistoricalBalancesCache(new Map());
  }, [days]);

  const {
    data: tokenHoldersData,
    error: tokenHoldersError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetTopTokenHoldersQuery({
    variables: {
      limit,
      skip: 0,
      orderDirection,
      ...(address && { addresses: [address] }),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always check network for fresh data
  });

  const tokenHolderAddresses = useMemo(
    () =>
      tokenHoldersData?.accountBalances?.items
        ?.filter((tokenHolder) => tokenHolder !== null)
        .map((tokenHolder) => tokenHolder.address)
        .filter(Boolean) || [],
    [tokenHoldersData],
  );

  const newAddressesForHistoricalVP = useMemo(
    () =>
      tokenHolderAddresses.filter((addr) => !historicalBalancesCache.has(addr)),
    [tokenHolderAddresses, historicalBalancesCache],
  );

  const { data: newHistoricalData, loading: historicalLoading } =
    useHistoricalBalances(daoId, newAddressesForHistoricalVP, days);

  useEffect(() => {
    if (newHistoricalData) {
      setHistoricalBalancesCache((prevCache) => {
        const newCache = new Map(prevCache);
        newHistoricalData?.forEach((h) => {
          if (h?.accountId && h.previousBalance) {
            newCache.set(h.accountId, h.previousBalance);
          }
        });
        return newCache;
      });
    }
  }, [newHistoricalData]);

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      limit,
      skip: 0,
      orderDirection,
      ...(address && { addresses: [address] }),
    });
  }, [orderBy, orderDirection, limit, refetch, address]);

  const processedData = useMemo(() => {
    if (!tokenHoldersData?.accountBalances?.items) return null;

    return tokenHoldersData.accountBalances.items
      .filter((holder) => holder !== null)
      .map((holder) => ({
        accountId: holder.address,
        balance: holder.balance,
        delegate: holder.delegate,
        tokenId: holder.tokenId,
      }));
  }, [tokenHoldersData]);

  const isHistoricalLoadingFor = useCallback(
    (addr: string) => historicalLoading && !historicalBalancesCache.has(addr),
    [historicalBalancesCache, historicalLoading],
  );

  // Pagination info - combines GraphQL data with our page tracking
  const pagination = useMemo<PaginationInfo>(() => {
    const totalCount = tokenHoldersData?.accountBalances?.totalCount || 0;
    const currentItemsCount =
      tokenHoldersData?.accountBalances?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      endCursor: null,
      startCursor: null,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [
    tokenHoldersData?.accountBalances?.totalCount,
    tokenHoldersData?.accountBalances?.items?.length,
    currentPage,
    itemsPerPage,
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
    isHistoricalLoadingFor,
    historicalBalancesCache,
  };
};
