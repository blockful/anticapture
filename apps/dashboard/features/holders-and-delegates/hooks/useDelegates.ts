import {
  useGetDelegatesQuery,
  useGetHistoricalVotingAndActivityQuery,
} from "@anticapture/graphql-client/hooks";
import {
  QueryInput_HistoricalVotingPower_DaoId,
  QueryInput_ProposalsActivity_DaoId,
} from "@anticapture/graphql-client";
import { useMemo, useCallback } from "react";
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
}

export const useDelegates = ({
  blockNumber,
  fromDate,
  daoId,
}: UseDelegatesParams): UseDelegatesResult => {
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
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
  });

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
      address:
        delegateAddresses[0] || "0x0000000000000000000000000000000000000000",
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

  // Pagination info
  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = delegatesData?.accountPowers?.pageInfo;
    return {
      hasNextPage: pageInfo?.hasNextPage ?? false,
      hasPreviousPage: pageInfo?.hasPreviousPage ?? false,
      endCursor: pageInfo?.endCursor,
      startCursor: pageInfo?.startCursor,
    };
  }, [delegatesData?.accountPowers?.pageInfo]);

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
    } catch (error) {
      console.error("Error fetching next page:", error);
    }
  }, [fetchMore, pagination.hasNextPage, pagination.endCursor]);

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
    } catch (error) {
      console.error("Error fetching previous page:", error);
    }
  }, [fetchMore, pagination.hasPreviousPage, pagination.startCursor]);

  return {
    data: enrichedData,
    loading: delegatesLoading || activityLoading,
    error: delegatesError || activityError || null,
    refetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore: networkStatus === NetworkStatus.fetchMore,
  };
};
