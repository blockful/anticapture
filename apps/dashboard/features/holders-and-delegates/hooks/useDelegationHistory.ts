import {
  useGetDelegationHistoryItemsQuery,
  useGetDelegationHistoryCountQuery,
} from "@anticapture/graphql-client/hooks";
import {
  GetDelegationHistoryItemsQuery,
  GetDelegationHistoryCountQuery,
  QueryInput_HistoricalVotingPower_DaoId,
} from "@anticapture/graphql-client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";

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

interface UseDelegationHistoryResult {
  data: GetDelegationHistoryItemsQuery["delegations"]["items"] | null;
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
  daoId: QueryInput_HistoricalVotingPower_DaoId;
  orderBy?: string;
  orderDirection?: string;
}

export const useDelegationHistory = ({
  delegatorAccountId,
  daoId,
  orderBy = "timestamp",
  orderDirection = "desc",
}: UseDelegationHistoryParams): UseDelegationHistoryResult => {
  const itemsPerPage = 2; // This should match the limit in the GraphQL query

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
    loading: itemsLoading,
    error: itemsError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetDelegationHistoryItemsQuery({
    variables: {
      delegator: delegatorAccountId,
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
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
    refetch({
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
    });
  }, [orderBy, orderDirection, refetch]);

  // Process the delegation history data
  const processedData = useMemo(() => {
    if (!delegationHistoryData?.delegations?.items) return null;

    return delegationHistoryData.delegations.items.map(
      (
        delegation: GetDelegationHistoryItemsQuery["delegations"]["items"][number],
      ) => ({
        delegate: delegation.delegate,
        timestamp: delegation.timestamp,
      }),
    );
  }, [delegationHistoryData]);

  // Fetch totalCount with separate lightweight query
  const { data: countData, loading: countLoading } =
    useGetDelegationHistoryCountQuery({
      variables: { delegator: delegatorAccountId },
      context: {
        headers: {
          "anticapture-dao-id": daoId,
        },
      },
    });

  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = delegationHistoryData?.delegations?.pageInfo;
    const totalCount = countData?.delegations?.totalCount || 0;
    const currentItemsCount =
      delegationHistoryData?.delegations?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage: pageInfo?.hasNextPage || false,
      hasPreviousPage: pageInfo?.hasPreviousPage || false,
      endCursor: pageInfo?.endCursor,
      startCursor: pageInfo?.startCursor,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [
    delegationHistoryData?.delegations?.pageInfo,
    delegationHistoryData?.delegations?.items?.length,
    currentPage,
    itemsPerPage,
    countData?.delegations?.totalCount,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (
      !pagination.hasNextPage ||
      !pagination.endCursor ||
      isPaginationLoading
    ) {
      console.warn("No next page available");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          delegator: delegatorAccountId,
          after: pagination.endCursor,
          before: undefined,
          orderBy,
          orderDirection,
        },
        updateQuery: (
          previousResult: GetDelegationHistoryItemsQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult?: GetDelegationHistoryItemsQuery },
        ) => {
          if (!fetchMoreResult) return previousResult;

          // Replace the current data with the new page data
          return {
            ...fetchMoreResult,
            delegations: {
              ...fetchMoreResult.delegations,
              items: fetchMoreResult.delegations.items,
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
    orderBy,
    orderDirection,
    delegatorAccountId,
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
          orderBy,
          orderDirection,
        },
        updateQuery: (
          previousResult: GetDelegationHistoryItemsQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult?: GetDelegationHistoryItemsQuery },
        ) => {
          if (!fetchMoreResult) return previousResult;

          // Replace the current data with the new page data
          return {
            ...fetchMoreResult,
            delegations: {
              ...fetchMoreResult.delegations,
              items: fetchMoreResult.delegations.items,
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
    orderBy,
    orderDirection,
    isPaginationLoading,
  ]);

  // Enhanced refetch that resets pagination
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  return {
    data: processedData,
    loading: itemsLoading || countLoading,
    error: itemsError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
};
