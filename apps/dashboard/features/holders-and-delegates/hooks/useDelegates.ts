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
  }, [orderBy, orderDirection, address, days]);

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
    context: { headers: { "anticapture-dao-id": daoId } },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always check network for fresh data
  });

  const { data: countingData } = useGetDelegatesCountQuery({
    context: { headers: { "anticapture-dao-id": daoId } },
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

  const delegateAddresses = useMemo(
    () =>
      delegatesData?.accountPowers?.items
        ?.map((delegate) => delegate.accountId)
        .filter(Boolean) || [],
    [delegatesData],
  );

  const newAddressesForHistoricalVP = useMemo(
    () => delegateAddresses.filter((addr) => !historicalVPCache.has(addr)),
    [delegateAddresses, historicalVPCache],
  );

  // Get historical voting power data
  const { data: newHistoricalData, loading: historicalLoading } =
    useGetHistoricalVotingAndActivityQuery({
      variables: {
        addresses: newAddressesForHistoricalVP,
        address: newAddressesForHistoricalVP[0] || "", // This is still needed for the query structure
        fromDate,
        days: QueryInput_HistoricalVotingPower_Days[days],
      },
      context: { headers: { "anticapture-dao-id": daoId } },
      skip: newAddressesForHistoricalVP.length === 0,
    });

  useEffect(() => {
    if (newHistoricalData?.historicalVotingPower) {
      setHistoricalVPCache((prevCache) => {
        const newCache = new Map(prevCache);
        newHistoricalData.historicalVotingPower?.forEach((h) => {
          if (h?.address && h.votingPower) {
            newCache.set(h.address, h.votingPower);
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
    const newAddresses = delegateAddresses.filter(
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
            variables: { address: addr, fromDate },
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
    if (!delegatesData?.accountPowers?.items) return null;

    return delegatesData.accountPowers.items.map((delegate) => {
      const historicalVotingPower = historicalVPCache.get(delegate.accountId);
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
    const pageInfo = delegatesData?.accountPowers?.pageInfo;
    const totalCount = countingData?.accountPowers?.totalCount || 0;
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
    delegatesData?.accountPowers?.pageInfo,
    countingData?.accountPowers?.totalCount,
    finalData,
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
          if (!fetchMoreResult?.accountPowers?.items) return previousResult;
          const prevItems = previousResult.accountPowers.items ?? [];
          const newItems = fetchMoreResult.accountPowers.items ?? [];
          return {
            ...fetchMoreResult,
            accountPowers: {
              ...fetchMoreResult.accountPowers,
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
  }, [
    fetchMore,
    pagination,
    isPaginationLoading,
    address,
    orderBy,
    orderDirection,
  ]);

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
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
      ...(address && { addresses: [address] }),
    });
  }, [refetch, orderBy, orderDirection, address]);

  return {
    data: finalData,
    loading: networkStatus === NetworkStatus.loading && !finalData?.length,
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
