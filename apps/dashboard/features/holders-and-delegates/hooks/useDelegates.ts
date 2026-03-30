"use client";

import {
  OrderDirection,
  type QueryInput_VotingPowers_OrderBy,
} from "@anticapture/graphql-client";
import {
  useGetDelegatesQuery,
  useGetDelegateProposalsActivityLazyQuery,
} from "@anticapture/graphql-client/hooks";
import { NetworkStatus } from "@apollo/client";
import { useMemo, useCallback, useState, useEffect } from "react";

import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums";
import { getAuthHeaders } from "@/shared/utils/server-utils";

interface ProposalsActivity {
  totalProposals: number;
  votedProposals: number;
  neverVoted: boolean;
  avgTimeBeforeEnd?: number;
}

export interface DelegateVariation {
  absoluteChange: string;
  percentageChange: string;
}

export interface Delegate {
  votingPower: string;
  delegationsCount: number;
  accountId: string;
  proposalsActivity?: ProposalsActivity;
  variation: DelegateVariation;
  balance?: string;
}

interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
}

interface UseDelegatesResult {
  data: Delegate[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchingMore: boolean;
  isActivityLoadingFor: (addr: string) => boolean;
}

interface UseDelegatesParams {
  days: TimeInterval;
  daoId: DaoIdEnum;
  address?: string;
  orderBy?: QueryInput_VotingPowers_OrderBy;
  orderDirection?: OrderDirection;
  limit?: number;
  skipActivity?: boolean;
}

export const useDelegates = ({
  daoId,
  orderBy,
  orderDirection = OrderDirection.Desc,
  days,
  address,
  limit = 15,
  skipActivity = false,
}: UseDelegatesParams): UseDelegatesResult => {
  // Track current page - this is the source of truth for page number
  const [currentPage, setCurrentPage] = useState(1);

  // Track pagination loading state to prevent rapid clicks
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  const [delegateActivities, setDelegateActivities] = useState<
    Map<string, ProposalsActivity>
  >(new Map());
  const [loadingActivityAddresses, setLoadingActivityAddresses] = useState<
    Set<string>
  >(new Set());

  const fromDate = useMemo(() => {
    return Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days];
  }, [days]);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
    setDelegateActivities(new Map());
    setLoadingActivityAddresses(new Set());
  }, [orderDirection, address, days, orderBy]);

  const {
    data: delegatesData,
    error: delegatesError,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetDelegatesQuery({
    variables: {
      orderDirection,
      orderBy,
      limit,
      fromDate,
      toDate: null,
      addresses: address ? [address] : null,
    },
    context: {
      headers: { "anticapture-dao-id": daoId, ...getAuthHeaders() },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      orderDirection,
      orderBy,
      fromDate,
      toDate: null,
      addresses: address ? [address] : null,
    });
  }, [orderDirection, address, refetch, orderBy, fromDate]);

  const delegateAddresses = useMemo(
    () =>
      delegatesData?.votingPowers?.items
        ?.map((delegate) => delegate?.accountId)
        .filter(Boolean) || [],
    [delegatesData],
  );

  const [getDelegateProposalsActivity] =
    useGetDelegateProposalsActivityLazyQuery({
      context: {
        headers: { "anticapture-dao-id": daoId, ...getAuthHeaders() },
      },
    });

  // Fetch proposals activity for all delegates using Promise.all
  useEffect(() => {
    if (skipActivity) return;

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
    skipActivity,
  ]);

  const finalData = useMemo(() => {
    if (!delegatesData?.votingPowers?.items) return null;

    return delegatesData.votingPowers.items
      .filter((item) => item !== null)
      .map((delegate) => {
        const proposalsActivity = delegateActivities.get(delegate.accountId);

        return {
          ...delegate,
          balance: delegate.balance ?? undefined,
          variation: delegate.variation
            ? {
                absoluteChange: delegate.variation.absoluteChange,
                percentageChange: delegate.variation.percentageChange,
              }
            : { absoluteChange: "0", percentageChange: "0" },
          proposalsActivity,
        };
      });
  }, [delegatesData, delegateActivities]);

  const isActivityLoadingFor = useCallback(
    (addr: string) => loadingActivityAddresses.has(addr),
    [loadingActivityAddresses],
  );

  const totalCount = delegatesData?.votingPowers?.totalCount || 0;
  const currentItemsCount = finalData?.length || 0;
  const hasNextPage = currentItemsCount < totalCount;

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (isPaginationLoading || !hasNextPage) return;
    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          orderDirection,
          orderBy,
          fromDate,
          toDate: null,
          addresses: address ? [address] : null,
          skip: currentItemsCount,
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
  }, [
    fetchMore,
    isPaginationLoading,
    currentItemsCount,
    hasNextPage,
    address,
    orderDirection,
    orderBy,
    fromDate,
  ]);

  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch({
      orderDirection,
      orderBy,
      fromDate,
      toDate: null,
      addresses: address ? [address] : null,
    });
  }, [refetch, orderDirection, address, orderBy, fromDate]);

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
    pagination: {
      currentPage,
      hasNextPage: currentPage * limit < (totalCount || 0),
      hasPreviousPage: currentPage > 1,
    },
    fetchNextPage,
    fetchingMore:
      isPaginationLoading || networkStatus === NetworkStatus.fetchMore,
    isActivityLoadingFor,
  };
};
