"use client";

import type {
  ProposalsActivityPathParamsDaoEnumKey,
  VotingPower,
  VotingPowersPathParamsDaoEnumKey,
  VotingPowersQueryParamsOrderByEnumKey,
  VotingPowersQueryResponse,
} from "@anticapture/client";
import {
  proposalsActivityQueryOptions,
  useVotingPowersInfinite,
} from "@anticapture/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useState, useEffect } from "react";

import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums";

export interface ProposalsActivity {
  totalProposals: number;
  votedProposals: number;
  neverVoted: boolean;
  avgTimeBeforeEnd?: number;
}

export interface DelegateVariation {
  absoluteChange: string;
  percentageChange: string;
}

export interface Delegate extends Pick<
  VotingPower,
  "accountId" | "delegationsCount"
> {
  votingPower: string;
  proposalsActivity?: ProposalsActivity;
  variation: DelegateVariation;
  balance?: string;
}

interface UseDelegatesResult {
  data: Delegate[] | null;
  loading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchingMore: boolean;
  isActivityLoadingFor: (addr: string) => boolean;
}

interface UseDelegatesParams {
  days: TimeInterval;
  daoId: DaoIdEnum;
  address?: string;
  orderBy?: VotingPowersQueryParamsOrderByEnumKey;
  orderDirection?: "asc" | "desc";
  limit?: number;
  skipActivity?: boolean;
}

const getNextPageParam = (
  lastPage: VotingPowersQueryResponse,
  allPages: VotingPowersQueryResponse[],
): number | undefined => {
  const loaded = allPages.reduce((s, p) => s + p.items.length, 0);
  return loaded >= lastPage.totalCount ? undefined : loaded;
};

export const useDelegates = ({
  daoId,
  orderBy,
  orderDirection = "desc",
  days,
  address,
  limit = 15,
  skipActivity = false,
}: UseDelegatesParams): UseDelegatesResult => {
  const queryClient = useQueryClient();

  const [delegateActivities, setDelegateActivities] = useState<
    Map<string, ProposalsActivity>
  >(() => new Map());
  const [loadingActivityAddresses, setLoadingActivityAddresses] = useState<
    Set<string>
  >(() => new Set());

  const fromDate = useMemo(() => {
    return Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days];
  }, [days]);

  useEffect(() => {
    setDelegateActivities(new Map());
    setLoadingActivityAddresses(new Set());
  }, [orderDirection, address, days, orderBy]);

  const params = useMemo(
    () => ({
      orderDirection,
      ...(orderBy ? { orderBy } : {}),
      limit,
      fromDate,
      ...(address ? { addresses: [address] } : {}),
    }),
    [orderDirection, orderBy, limit, fromDate, address],
  );

  const {
    data: delegatesData,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useVotingPowersInfinite(
    daoId.toLowerCase() as VotingPowersPathParamsDaoEnumKey,
    params,
    { query: { getNextPageParam } },
  );

  const allDelegates = useMemo(
    () => delegatesData?.pages.flatMap((p) => p.items) ?? [],
    [delegatesData],
  );

  const delegateAddresses = useMemo(
    () => allDelegates.map((d) => d.accountId).filter(Boolean),
    [allDelegates],
  );

  useEffect(() => {
    if (skipActivity) return;

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
          const result = await queryClient.fetchQuery(
            proposalsActivityQueryOptions(
              daoId.toLowerCase() as ProposalsActivityPathParamsDaoEnumKey,
              { address: addr, fromDate },
            ),
          );
          return { address: addr, activity: result ?? null };
        });
        const activities = await Promise.all(activityPromises);
        setDelegateActivities((prev) => {
          const next = new Map(prev);
          activities.forEach(({ address: addr, activity }) => {
            if (activity) {
              next.set(addr, {
                totalProposals: activity.totalProposals,
                votedProposals: activity.votedProposals,
                neverVoted: activity.neverVoted,
                avgTimeBeforeEnd: activity.avgTimeBeforeEnd,
              });
            }
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
    void fetchDelegateActivities();
  }, [
    delegateAddresses,
    delegateActivities,
    queryClient,
    fromDate,
    loadingActivityAddresses,
    skipActivity,
    daoId,
  ]);

  const finalData = useMemo(() => {
    if (!allDelegates.length) return null;
    return allDelegates.map((delegate) => ({
      accountId: delegate.accountId,
      votingPower: delegate.votingPower.toString(),
      delegationsCount: delegate.delegationsCount,
      balance: delegate.balance?.toString() ?? undefined,
      variation: delegate.variation
        ? {
            absoluteChange: delegate.variation.absoluteChange.toString(),
            percentageChange: delegate.variation.percentageChange,
          }
        : { absoluteChange: "0", percentageChange: "0" },
      proposalsActivity: delegateActivities.get(delegate.accountId),
    }));
  }, [allDelegates, delegateActivities]);

  const isActivityLoadingFor = useCallback(
    (addr: string) => loadingActivityAddresses.has(addr),
    [loadingActivityAddresses],
  );

  const fetchNextPageStable = useCallback(async () => {
    await fetchNextPage();
  }, [fetchNextPage]);

  return {
    data: finalData,
    loading: isLoading && !allDelegates.length,
    error: error ?? null,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage: fetchNextPageStable,
    fetchingMore: isFetchingNextPage,
    isActivityLoadingFor,
  };
};
