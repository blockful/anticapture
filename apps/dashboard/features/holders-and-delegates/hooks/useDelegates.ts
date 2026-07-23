"use client";

import {
  getNextPageParam,
  type ProposalsActivityPathParamsDaoEnumKey,
  type VotingPower,
  type VotingPowersPathParamsDaoEnumKey,
  type VotingPowersQueryParamsOrderByEnumKey,
} from "@anticapture/client";
import {
  proposalsActivityQueryOptions,
  useVotingPowersInfinite,
} from "@anticapture/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useState, useEffect } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

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
  fetchNextPage: () => Promise<unknown>;
  fetchingMore: boolean;
  isActivityLoadingFor: (addr: string) => boolean;
}

interface UseDelegatesParams {
  fromDate?: number;
  toDate?: number;
  daoId: DaoIdEnum;
  address?: string;
  orderBy?: VotingPowersQueryParamsOrderByEnumKey;
  orderDirection?: "asc" | "desc";
  limit?: number;
  skipActivity?: boolean;
  fromValue?: string;
  toValue?: string;
}

export const useDelegates = ({
  daoId,
  orderBy,
  orderDirection = "desc",
  fromDate,
  toDate,
  address,
  limit = 15,
  skipActivity = false,
  fromValue,
  toValue,
}: UseDelegatesParams): UseDelegatesResult => {
  const queryClient = useQueryClient();

  const [delegateActivities, setDelegateActivities] = useState<
    Map<string, ProposalsActivity>
  >(() => new Map());
  const [loadingActivityAddresses, setLoadingActivityAddresses] = useState<
    Set<string>
  >(() => new Set());

  useEffect(() => {
    setDelegateActivities(new Map());
    setLoadingActivityAddresses(new Set());
  }, [orderDirection, address, fromDate, toDate, orderBy]);

  const params = useMemo(
    () => ({
      orderDirection,
      ...(orderBy ? { orderBy } : {}),
      limit,
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(address ? { addresses: [address] } : {}),
      ...(fromValue ? { fromValue } : {}),
      ...(toValue ? { toValue } : {}),
    }),
    [
      orderDirection,
      orderBy,
      limit,
      fromDate,
      toDate,
      address,
      fromValue,
      toValue,
    ],
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
              { address: addr, ...(fromDate ? { fromDate } : {}) },
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

  return {
    data: finalData,
    loading: isLoading && !allDelegates.length,
    error: error ?? null,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
    isActivityLoadingFor,
  };
};
