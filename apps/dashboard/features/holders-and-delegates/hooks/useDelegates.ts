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
import { useMemo, useCallback, useRef, useState, useEffect } from "react";

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
  const [settledActivityAddresses, setSettledActivityAddresses] = useState<
    Set<string>
  >(() => new Set());

  // Requests in flight when the selection changes settle after the reset below,
  // carrying the previous selection's counts. Each selection gets a generation
  // and a response is only merged while its own generation is current.
  const activityGeneration = `${daoId}:${orderDirection}:${orderBy ?? ""}:${
    address ?? ""
  }:${fromDate ?? ""}:${toDate ?? ""}`;
  const currentActivityGeneration = useRef(activityGeneration);

  useEffect(() => {
    currentActivityGeneration.current = activityGeneration;
    setDelegateActivities(new Map());
    setLoadingActivityAddresses(new Set());
    setSettledActivityAddresses(new Set());
  }, [activityGeneration]);

  const params = useMemo(
    () => ({
      orderDirection,
      ...(orderBy ? { orderBy } : {}),
      limit,
      // `!= null`, not truthy: MAX sends `fromDate: 0` as an explicit all-time
      // floor, and dropping it would let the endpoint apply its own default.
      ...(fromDate != null ? { fromDate } : {}),
      ...(toDate != null ? { toDate } : {}),
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
        !settledActivityAddresses.has(addr) &&
        !loadingActivityAddresses.has(addr),
    );
    if (newAddresses.length === 0) return;

    const fetchDelegateActivities = async () => {
      const requestGeneration = activityGeneration;
      setLoadingActivityAddresses(
        (prev) => new Set([...prev, ...newAddresses]),
      );
      // One address failing must not discard the activity of the others.
      const activities = await Promise.allSettled(
        newAddresses.map(async (addr) => {
          const result = await queryClient.fetchQuery(
            proposalsActivityQueryOptions(
              daoId.toLowerCase() as ProposalsActivityPathParamsDaoEnumKey,
              {
                address: addr,
                ...(fromDate != null ? { fromDate } : {}),
                // Both bounds, so "Voted X/Y" counts the selected window
                // instead of everything up to today.
                ...(toDate != null ? { toDate } : {}),
              },
            ),
          );
          return { address: addr, activity: result ?? null };
        }),
      );
      // The reset effect already cleared this generation's state; merging now
      // would put the previous selection's counts back on the rows.
      if (currentActivityGeneration.current !== requestGeneration) return;
      setDelegateActivities((prev) => {
        const next = new Map(prev);
        activities.forEach((entry) => {
          if (entry.status !== "fulfilled" || !entry.value.activity) return;
          const { address: addr, activity } = entry.value;
          next.set(addr, {
            totalProposals: activity.totalProposals,
            votedProposals: activity.votedProposals,
            neverVoted: activity.neverVoted,
            avgTimeBeforeEnd: activity.avgTimeBeforeEnd,
          });
        });
        return next;
      });
      // Settled means "attempted", success or not. Keying this on
      // delegateActivities instead would re-select every failed address as soon
      // as it left the loading set, refetching it in a loop.
      setSettledActivityAddresses(
        (prev) => new Set([...prev, ...newAddresses]),
      );
      setLoadingActivityAddresses((prev) => {
        const next = new Set(prev);
        newAddresses.forEach((a) => next.delete(a));
        return next;
      });
    };
    void fetchDelegateActivities();
  }, [
    delegateAddresses,
    settledActivityAddresses,
    queryClient,
    fromDate,
    toDate,
    loadingActivityAddresses,
    skipActivity,
    daoId,
    activityGeneration,
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
