import {
  useGetTopTokenHoldersQuery,
  useGetTokenHoldersCoutingQuery,
} from "@anticapture/graphql-client/hooks";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";

interface TokenHolder {
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
}

interface UseTokenHoldersParams {
  daoId: string;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  addresses?: string[];
}

export const useTokenHolders = ({
  daoId,
  orderBy = "balance",
  orderDirection = "desc",
  limit = 10,
  addresses,
}: UseTokenHoldersParams): UseTokenHoldersResult => {
  const itemsPerPage = limit;

  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection, addresses]);

  const {
    data: tokenHoldersData,
    loading: tokenHoldersLoading,
    error: tokenHoldersError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetTopTokenHoldersQuery({
    variables: {
      after: undefined,
      before: undefined,
      limit,
      orderDirection,
      ...(addresses && addresses.length > 0 && { addresses }),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always check network for fresh data
  });

  const { data: countingData } = useGetTokenHoldersCoutingQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      after: undefined,
      before: undefined,
      limit,
      orderDirection,
      ...(addresses && addresses.length > 0 && { addresses }),
    });
  }, [orderBy, orderDirection, limit, refetch, addresses]);

  const processedData = useMemo(() => {
    if (!tokenHoldersData?.accountBalances?.items) return null;

    return tokenHoldersData.accountBalances.items.map((holder) => ({
      accountId: holder.accountId,
      balance: holder.balance,
      delegate: holder.delegate,
      tokenId: holder.tokenId,
    }));
  }, [tokenHoldersData]);

  // Pagination info - combines GraphQL data with our page tracking
  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = tokenHoldersData?.accountBalances?.pageInfo;
    const totalCount = countingData?.accountBalances?.totalCount || 0;
    const currentItemsCount =
      tokenHoldersData?.accountBalances?.items?.length || 0;
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
    tokenHoldersData?.accountBalances?.pageInfo,
    countingData?.accountBalances?.totalCount,
    tokenHoldersData?.accountBalances?.items?.length,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (
      !pagination.hasNextPage ||
      !pagination.endCursor ||
      isPaginationLoading
    ) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          after: pagination.endCursor,
          before: undefined,
          limit,
          orderDirection,
          ...(addresses && addresses.length > 0 && { addresses }),
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

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
      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    pagination.endCursor,
    limit,
    orderDirection,
    addresses,
    isPaginationLoading,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (
      !pagination.hasPreviousPage ||
      !pagination.startCursor ||
      isPaginationLoading
    ) {
      console.warn("No previous page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          after: undefined,
          before: pagination.startCursor,
          limit,
          orderDirection,
          ...(addresses && addresses.length > 0 && { addresses }),
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

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
    pagination.startCursor,
    limit,
    orderDirection,
    addresses,
    isPaginationLoading,
  ]);

  // Enhanced refetch that resets pagination
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  return {
    data: processedData,
    loading: tokenHoldersLoading,
    error: tokenHoldersError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
};
