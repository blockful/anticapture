import {
  useGetDelegatesQuery,
  useGetHistoricalVotingAndActivityQuery,
  useGetDelegatesCountQuery,
  useGetDelegateProposalsActivityLazyQuery,
  QueryInput_HistoricalVotingPower_Days,
} from "@anticapture/graphql-client/hooks";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
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
  isHistoricalLoadingFor: (addr: string) => boolean;
  isActivityLoadingFor: (addr: string) => boolean;
}

interface UseDelegatesParams {
  fromDate: number;
  daoId: DaoIdEnum;
  orderBy?: string;
  orderDirection?: string;
  days: TimeInterval;
  address?: string;
}

export const useDelegates = ({
  fromDate,
  daoId,
  orderBy = "votingPower",
  orderDirection = "desc",
  days,
  address,
}: UseDelegatesParams): UseDelegatesResult => {
  const itemsPerPage = 10; // This should match the limit in the GraphQL query

  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState(1);

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Track proposals activity data for each delegate
  const [delegateActivities, setDelegateActivities] = useState<
    Record<string, ProposalsActivity>
  >({});
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const loadedHistoricalAddressesRef = useRef<Set<string>>(new Set());
  const loadedActivityAddressesRef = useRef<Set<string>>(new Set());
  const [loadingActivityAddresses, setLoadingActivityAddresses] = useState<
    Set<string>
  >(new Set());

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection, address]);

  const {
    data: delegatesData,
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

  useEffect(() => {
    const list = historicalData?.historicalVotingPower;
    if (!list || list.length === 0) return;
    let mutated = false;
    list.forEach((h) => {
      if (h?.address && !loadedHistoricalAddressesRef.current.has(h.address)) {
        loadedHistoricalAddressesRef.current.add(h.address);
        mutated = true;
      }
    });
    if (mutated) {
      loadedHistoricalAddressesRef.current;
    }
  }, [historicalData]);

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

    const newAddresses = delegateAddresses.filter(
      (addr) => addr && !loadedActivityAddressesRef.current.has(addr),
    );
    if (newAddresses.length === 0) return;

    const fetchDelegateActivities = async () => {
      setActivitiesLoading(true);
      setLoadingActivityAddresses(
        (prev) => new Set([...prev, ...newAddresses]),
      );
      try {
        const activityPromises = newAddresses.map(async (addr) => {
          const result = await getDelegateProposalsActivity({
            variables: { address: addr, fromDate },
          });
          return {
            address: addr,
            activity: result.data?.proposalsActivity ?? null,
          };
        });

        const activities = await Promise.all(activityPromises);

        setDelegateActivities((prev) => {
          const next = { ...prev };
          activities.forEach(({ address, activity }) => {
            if (activity) {
              next[address] = {
                totalProposals: activity.totalProposals,
                votedProposals: activity.votedProposals,
                neverVoted: activity.neverVoted ? 1 : 0,
              };
              loadedActivityAddressesRef.current.add(address);
            }
          });
          return next;
        });
      } catch (err) {
        console.error("Error fetching delegate activities:", err);
      } finally {
        setActivitiesLoading(false);
        setLoadingActivityAddresses((prev) => {
          const next = new Set(prev);
          newAddresses.forEach((a) => next.delete(a));
          return next;
        });
      }
    };

    fetchDelegateActivities();
  }, [delegateAddresses, getDelegateProposalsActivity, fromDate]);

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
          const prevItems = previousResult.accountPowers.items ?? [];
          const newItems = fetchMoreResult.accountPowers.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) => !prevItems.some((p) => p.accountId === n.accountId),
            ),
          ];

          return {
            ...fetchMoreResult,
            accountPowers: {
              ...fetchMoreResult.accountPowers,
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

  const isHistoricalLoadingFor = useCallback(
    (addr: string) =>
      historicalLoading && !loadedHistoricalAddressesRef.current.has(addr),
    [historicalLoading],
  );

  const isActivityLoadingFor = useCallback(
    (addr: string) =>
      (activitiesLoading && !loadedActivityAddressesRef.current.has(addr)) ||
      loadingActivityAddresses.has(addr),
    [activitiesLoading, loadingActivityAddresses],
  );

  return {
    data: finalData,
    loading: networkStatus === NetworkStatus.loading,
    error: delegatesError || historicalError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      isPaginationLoading || networkStatus === NetworkStatus.fetchMore,
    isHistoricalLoadingFor,
    isActivityLoadingFor,
  };
};
