import {
  useGetDelegatesQuery,
  useGetHistoricalVotingAndActivityQuery,
} from "@anticapture/graphql-client/hooks";
import {
  QueryInput_HistoricalVotingPower_DaoId,
  QueryInput_ProposalsActivity_DaoId,
} from "@anticapture/graphql-client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";

interface ProposalsActivity {
  totalProposals: number;
  votedProposals: number;
  neverVoted: number;
}

interface Delegate {
  votingPower: any;
  delegationsCount: number;
  account?: {
    type: string;
    id: string;
  } | null;
  proposalsActivity?: ProposalsActivity;
  historicalVotingPower?: string;
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

interface UseDelegatesResult {
  data: Delegate[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
}

interface UseDelegatesParams {
  blockNumber: number;
  fromDate: number;
  daoId: QueryInput_HistoricalVotingPower_DaoId;
  orderBy?: string;
  orderDirection?: string;
}

export const useDelegates = ({
  blockNumber,
  fromDate,
  daoId,
  orderBy = "votingPower",
  orderDirection = "desc",
}: UseDelegatesParams): UseDelegatesResult => {
  const itemsPerPage = 10; // This should match the limit in the GraphQL query

  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  const {
    data: delegatesData,
    loading: delegatesLoading,
    error: delegatesError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetDelegatesQuery({
    variables: {
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

  const delegateAddresses = useMemo(() => {
    return (
      delegatesData?.accountPowers?.items
        ?.map((delegate) => delegate?.account?.id)
        .filter(Boolean) || []
    );
  }, [delegatesData]);

  const {
    data: activityData,
    loading: activityLoading,
    error: activityError,
  } = useGetHistoricalVotingAndActivityQuery({
    variables: {
      addresses: delegateAddresses,
      address: delegateAddresses[0] || "",
      blockNumber,
      daoId,
      proposalsDaoId: daoId as unknown as QueryInput_ProposalsActivity_DaoId,
      fromDate,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: delegateAddresses.length === 0,
  });

  const enrichedData = useMemo(() => {
    if (!delegatesData?.accountPowers?.items) return null;

    return delegatesData.accountPowers.items.map((delegate) => {
      const proposalsActivity = activityData?.proposalsActivity
        ? {
            totalProposals: activityData.proposalsActivity.totalProposals,
            votedProposals: activityData.proposalsActivity.votedProposals,
            neverVoted: activityData.proposalsActivity.neverVoted ? 1 : 0,
          }
        : undefined;

      // Find historical voting power for this delegate
      const historicalVotingPowerData =
        activityData?.historicalVotingPower?.find(
          (historical) => historical?.address === delegate.account?.id,
        );

      return {
        ...delegate,
        proposalsActivity,
        historicalVotingPower: historicalVotingPowerData?.votingPower,
      };
    });
  }, [delegatesData, activityData]);

  // Pagination info - combines GraphQL data with our page tracking
  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = delegatesData?.accountPowers?.pageInfo;
    const totalCount = delegatesData?.accountPowers?.totalCount || 0;
    const currentItemsCount = delegatesData?.accountPowers?.items?.length || 0;
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
    delegatesData?.accountPowers?.pageInfo,
    delegatesData?.accountPowers?.totalCount,
    delegatesData?.accountPowers?.items?.length,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || !pagination.endCursor) {
      console.warn("No next page available");
      return;
    }

    try {
      await fetchMore({
        variables: {
          after: pagination.endCursor,
          before: undefined,
          orderBy,
          orderDirection,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          // Replace the current data with the new page data
          return {
            ...fetchMoreResult,
            accountPowers: {
              ...fetchMoreResult.accountPowers,
              items: fetchMoreResult.accountPowers.items,
            },
          };
        },
      });

      // Update page number after successful fetch
      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    pagination.endCursor,
    orderBy,
    orderDirection,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (!pagination.hasPreviousPage || !pagination.startCursor) {
      console.warn("No previous page available");
      return;
    }

    try {
      await fetchMore({
        variables: {
          after: undefined,
          before: pagination.startCursor,
          orderBy,
          orderDirection,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          // Replace the current data with the new page data
          return {
            ...fetchMoreResult,
            accountPowers: {
              ...fetchMoreResult.accountPowers,
              items: fetchMoreResult.accountPowers.items,
            },
          };
        },
      });

      // Update page number after successful fetch
      setCurrentPage((prev) => prev - 1);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    }
  }, [
    fetchMore,
    pagination.hasPreviousPage,
    pagination.startCursor,
    orderBy,
    orderDirection,
  ]);

  // Enhanced refetch that resets pagination
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  return {
    data: enrichedData,
    loading: delegatesLoading || activityLoading,
    error: delegatesError || activityError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore: networkStatus === NetworkStatus.fetchMore,
  };
};
