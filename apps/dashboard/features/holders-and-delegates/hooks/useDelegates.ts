"use client";

import {
  useGetDelegatesQuery,
  useGetHistoricalVotingAndActivityQuery,
  useGetDelegatesCountQuery,
  useGetDelegateProposalsActivityLazyQuery,
  QueryInput_HistoricalVotingPower_Days,
} from "@anticapture/graphql-client/hooks";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

interface ProposalsActivity {
  totalProposals: number;
  votedProposals: number;
  neverVoted: number;
}

interface Delegate {
  votingPower: string;
  delegationsCount: number;
  accountId: string;
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
  historicalDataLoading: boolean;
}

interface UseDelegatesParams {
  fromDate: number;
  daoId: DaoIdEnum;
  orderBy?: string;
  orderDirection?: string;
  days: TimeInterval;
  address?: string;
  limit?: number;
}

export const useDelegates = ({
  fromDate,
  daoId,
  orderBy = "votingPower",
  orderDirection = "desc",
  days,
  address,
  limit = 15,
}: UseDelegatesParams): UseDelegatesResult => {
  const itemsPerPage = limit; // This should match the limit in the GraphQL query

  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState(1);

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Track proposals activity data for each delegate
  const [delegateActivities, setDelegateActivities] = useState<
    Record<string, ProposalsActivity>
  >({});
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection, address]);

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
      limit,
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

  const { data: countingData } = useGetDelegatesCountQuery({
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
      orderBy,
      orderDirection,
      ...(address && { addresses: [address] }),
    });
  }, [orderBy, orderDirection, address, refetch]);

  const delegateAddresses = useMemo(() => {
    return (
      delegatesData?.accountPowers?.items
        ?.map((delegate) => delegate?.accountId)
        .filter(Boolean) || []
    );
  }, [delegatesData]);

  // Get historical voting power data
  const {
    data: historicalData,
    loading: historicalLoading,
    error: historicalError,
  } = useGetHistoricalVotingAndActivityQuery({
    variables: {
      addresses: delegateAddresses,
      address: delegateAddresses[0] || "", // This is still needed for the query structure
      fromDate,
      days: QueryInput_HistoricalVotingPower_Days[days],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: delegateAddresses.length === 0,
  });

  // Lazy query for individual delegate proposals activity
  const [getDelegateProposalsActivity] =
    useGetDelegateProposalsActivityLazyQuery({
      context: {
        headers: {
          "anticapture-dao-id": daoId,
        },
      },
    });

  // Fetch proposals activity for all delegates using Promise.all
  useEffect(() => {
    if (delegateAddresses.length === 0) return;

    const fetchDelegateActivities = async () => {
      setActivitiesLoading(true);
      try {
        const activityPromises = delegateAddresses.map(async (address) => {
          if (!address) return { address: "", activity: null };

          const result = await getDelegateProposalsActivity({
            variables: {
              address,
              fromDate,
            },
          });
          return {
            address,
            activity: result.data?.proposalsActivity,
          };
        });

        const activities = await Promise.all(activityPromises);

        const activitiesMap: Record<string, ProposalsActivity> = {};
        activities.forEach(({ address, activity }) => {
          if (activity && address) {
            activitiesMap[address] = {
              totalProposals: activity.totalProposals,
              votedProposals: activity.votedProposals,
              neverVoted: activity.neverVoted ? 1 : 0,
            };
          }
        });

        setDelegateActivities(activitiesMap);
      } catch (error) {
        console.error("Error fetching delegate activities:", error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchDelegateActivities();
  }, [delegateAddresses, getDelegateProposalsActivity, daoId, fromDate]);

  // Create base data first (without historical data)
  const baseData = useMemo(() => {
    if (!delegatesData?.accountPowers?.items) return null;

    return delegatesData.accountPowers.items.map((delegate) => ({
      ...delegate,
      proposalsActivity: undefined, // Will be populated when activityData loads
      historicalVotingPower: undefined, // Will be populated when activityData loads
    }));
  }, [delegatesData]);

  // Enrich data with historical information when available
  const enrichedData = useMemo(() => {
    if (!baseData) return null;

    return baseData.map((delegate) => {
      const address = delegate.accountId;

      // Get proposals activity for this specific delegate
      const proposalsActivity =
        address && delegateActivities[address]
          ? delegateActivities[address]
          : undefined;

      // Find historical voting power for this delegate
      const historicalVotingPowerData =
        historicalData?.historicalVotingPower?.find(
          (historical) => historical?.address === delegate.accountId,
        );

      return {
        ...delegate,
        proposalsActivity,
        historicalVotingPower: historicalVotingPowerData?.votingPower,
      };
    });
  }, [baseData, delegateActivities, historicalData]);

  // Use enriched data if available, otherwise use base data
  const finalData = historicalData ? enrichedData : baseData;

  // Pagination info - combines GraphQL data with our page tracking
  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = delegatesData?.accountPowers?.pageInfo;
    const totalCount = countingData?.accountPowers?.totalCount || 0;
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
    countingData?.accountPowers?.totalCount,
    delegatesData?.accountPowers?.items?.length,
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
          orderBy,
          orderDirection,
          ...(address && { addresses: [address] }),
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
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    pagination.endCursor,
    orderBy,
    orderDirection,
    address,
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
          ...(address && { addresses: [address] }),
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
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasPreviousPage,
    pagination.startCursor,
    orderBy,
    orderDirection,
    address,
    isPaginationLoading,
  ]);

  // Enhanced refetch that resets pagination
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch({
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
      ...(address && { addresses: [address] }),
    });
  }, [refetch, orderBy, orderDirection, address]);

  return {
    data: finalData,
    loading: delegatesLoading,
    error: delegatesError || historicalError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
    historicalDataLoading: historicalLoading || activitiesLoading,
  };
};
