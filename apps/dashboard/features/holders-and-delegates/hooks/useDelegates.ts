"use client";

import {
  useGetDelegatesQuery,
  useGetHistoricalVotingAndActivityQuery,
  useGetDelegateProposalsActivityLazyQuery,
} from "@anticapture/graphql-client/hooks";
import { useMemo, useCallback, useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { QueryInput_VotingPowers_OrderDirection } from "@anticapture/graphql-client";

interface ProposalsActivity {
  totalProposals: number;
  votedProposals: number;
  neverVoted: boolean;
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
  address: string | null;
  days: TimeInterval;
  fromDate: number;
  daoId: DaoIdEnum;
  orderDirection?: QueryInput_VotingPowers_OrderDirection;
  limit?: number;
}

export const useDelegates = ({
  fromDate,
  daoId,
  orderDirection = QueryInput_VotingPowers_OrderDirection.Desc,
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
  const [historicalVPCache, setHistoricalVPCache] = useState<
    Map<string, string>
  >(new Map());
  const [delegateActivities, setDelegateActivities] = useState<
    Map<string, ProposalsActivity>
  >(new Map());
  const [loadingActivityAddresses, setLoadingActivityAddresses] = useState<
    Set<string>
  >(new Set());

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
    setHistoricalVPCache(new Map());
    setDelegateActivities(new Map());
    setLoadingActivityAddresses(new Set());
  }, [orderDirection, address, days]);

  const {
    data: delegatesData,
    error: delegatesError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetDelegatesQuery({
    variables: {
      orderDirection,
      limit,
      ...(address && { addresses: [address] }),
    },
    context: { headers: { "anticapture-dao-id": daoId } },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always check network for fresh data
  });

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      orderDirection,
      ...(address && { addresses: [address] }),
    });
  }, [orderDirection, address, refetch]);

  const delegateAddresses = useMemo(
    () =>
      delegatesData?.votingPowers?.items
        ?.map((delegate) => delegate?.accountId)
        .filter(Boolean) || [],
    [delegatesData],
  );

  const newAddressesForHistoricalVP = useMemo(
    () =>
      delegateAddresses.filter(
        (addr) => addr !== undefined && !historicalVPCache.has(addr),
      ),
    [delegateAddresses, historicalVPCache],
  );

  // Get historical voting power data
  const { data: newHistoricalData, loading: historicalLoading } =
    useGetHistoricalVotingAndActivityQuery({
      variables: {
        addresses: newAddressesForHistoricalVP,
        address: newAddressesForHistoricalVP[0] || "", // This is still needed for the query structure
        fromDate: fromDate.toString(),
        toDate: (fromDate + DAYS_IN_SECONDS[days]).toString(),
      },
      context: { headers: { "anticapture-dao-id": daoId } },
      skip: newAddressesForHistoricalVP.length === 0,
    });

  useEffect(() => {
    if (newHistoricalData?.votingPowerVariations) {
      setHistoricalVPCache((prevCache) => {
        const newCache = new Map(prevCache);
        newHistoricalData.votingPowerVariations?.items?.forEach((h) => {
          if (h?.accountId && h.previousVotingPower) {
            newCache.set(h.accountId, h.previousVotingPower);
          }
        });
        return newCache;
      });
    }
  }, [newHistoricalData]);

  const [getDelegateProposalsActivity] =
    useGetDelegateProposalsActivityLazyQuery({
      context: { headers: { "anticapture-dao-id": daoId } },
    });

  // Fetch proposals activity for all delegates using Promise.all
  useEffect(() => {
    const newAddresses = delegateAddresses
      .filter((addr) => addr !== undefined)
      .filter(
        (addr) =>
          !delegateActivities.has(addr) && !loadingActivityAddresses.has(addr),
      );

    if (newAddresses.length === 0) return;

    const fetchDelegateActivities = async () => {
      setLoadingActivityAddresses(
        (prev) => new Set([...prev, ...newAddresses]),
      );
      try {
        const activityPromises = newAddresses.map(async (addr) => {
          const result = await getDelegateProposalsActivity({
            variables: { address: addr, fromDate: fromDate.toString() },
          });
          return {
            address: addr,
            activity: result.data?.proposalsActivity ?? null,
          };
        });
        const activities = await Promise.all(activityPromises);
        setDelegateActivities((prev) => {
          const next = new Map(prev);
          activities.forEach(({ address, activity }) => {
            if (activity) next.set(address, activity);
          });
          return next;
        });
      } catch (err) {
        console.error("Error fetching delegate activities:", err);
      } finally {
        setLoadingActivityAddresses((prev) => {
          const next = new Set(prev);
          newAddresses.forEach((a) => next.delete(a));
          return next;
        });
      }
    };
    fetchDelegateActivities();
  }, [
    delegateAddresses,
    delegateActivities,
    getDelegateProposalsActivity,
    fromDate,
    loadingActivityAddresses,
  ]);

  const finalData = useMemo(() => {
    if (!delegatesData?.votingPowers?.items) return null;

    return delegatesData.votingPowers.items
      .filter((item) => item !== null)
      .map((delegate) => {
        const historicalVotingPower =
          historicalVPCache.get(delegate.accountId) || "0";
        const proposalsActivity = delegateActivities.get(delegate.accountId);
        return {
          ...delegate,
          historicalVotingPower,
          proposalsActivity,
        };
      });
  }, [delegatesData, historicalVPCache, delegateActivities]);

  const isHistoricalLoadingFor = useCallback(
    (addr: string) => historicalLoading && !historicalVPCache.has(addr),
    [historicalVPCache, historicalLoading],
  );

  const isActivityLoadingFor = useCallback(
    (addr: string) => loadingActivityAddresses.has(addr),
    [loadingActivityAddresses],
  );

  // Pagination info - combines GraphQL data with our page tracking
  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = delegatesData?.votingPowers?.pageInfo; // TODO: adjust pagination to new model
    const totalCount = delegatesData?.votingPowers?.totalCount || 0;
    const currentItemsCount = finalData?.length || 0;
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
    delegatesData?.votingPowers?.pageInfo,
    delegatesData?.votingPowers?.totalCount,
    finalData?.length,
    itemsPerPage,
    currentPage,
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
          orderDirection,
          ...(address && { addresses: [address] }),
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.votingPowers?.items) return previousResult;
          const prevItems = previousResult?.votingPowers?.items ?? [];
          const newItems = fetchMoreResult.votingPowers.items ?? [];
          return {
            ...fetchMoreResult,
            votingPowers: {
              ...fetchMoreResult.votingPowers,
              items: [...prevItems, ...newItems],
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
  }, [fetchMore, pagination, isPaginationLoading, address, orderDirection]);

  const fetchPreviousPage = useCallback(async () => {
    if (
      !pagination.hasPreviousPage ||
      !pagination.startCursor ||
      isPaginationLoading
    )
      return;
    setIsPaginationLoading(true);
    try {
      await fetchMore({
        variables: { after: undefined, before: pagination.startCursor },
        updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult || prev,
      });
      setCurrentPage((prev) => prev - 1);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [fetchMore, pagination, isPaginationLoading]);

  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch({
      orderDirection,
      ...(address && { addresses: [address] }),
    });
  }, [refetch, orderDirection, address]);

  const isLoading = useMemo(() => {
    return (
      (networkStatus === NetworkStatus.loading && !finalData?.length) ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus, finalData]);

  return {
    data: finalData,
    loading: isLoading,
    error: delegatesError || null,
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
