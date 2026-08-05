"use client";

import type { ProposalsActivityPathParamsDaoEnumKey } from "@anticapture/client";
import { proposalsActivityQueryOptions } from "@anticapture/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ProposalsActivity } from "@/features/holders-and-delegates/hooks/useDelegates";
import type { DaoIdEnum } from "@/shared/types/daos";

interface UseDelegatesActivityParams {
  daoId: DaoIdEnum;
  addresses: string[];
  fromDate?: number;
  toDate?: number;
}

// Fetches proposals-activity per delegate address (deduped by React Query's
// cache) so tables can flag inactive delegates without a bulk endpoint.
export const useDelegatesActivity = ({
  daoId,
  addresses,
  fromDate,
  toDate,
}: UseDelegatesActivityParams) => {
  const queryClient = useQueryClient();

  const [activities, setActivities] = useState<Map<string, ProposalsActivity>>(
    () => new Map(),
  );
  const [loadingAddresses, setLoadingAddresses] = useState<Set<string>>(
    () => new Set(),
  );
  // Addresses whose fetch already settled, successfully or not. `activities`
  // alone cannot play this role: a rejected response leaves no entry there, so
  // releasing the address from `loadingAddresses` would refetch it in a loop.
  const [settledAddresses, setSettledAddresses] = useState<Set<string>>(
    () => new Set(),
  );

  const addressesKey = addresses.join(",");

  // Requests in flight when the range or the DAO changes settle after the reset
  // below, carrying the previous selection's counts. Each selection gets a
  // generation and a response is only merged while its own is current.
  const generation = `${daoId}:${fromDate ?? ""}:${toDate ?? ""}`;
  const currentGeneration = useRef(generation);

  useEffect(() => {
    currentGeneration.current = generation;
    setActivities(new Map());
    setLoadingAddresses(new Set());
    setSettledAddresses(new Set());
  }, [generation]);

  useEffect(() => {
    const uniqueAddresses = [
      ...new Set(addressesKey.split(",").filter(Boolean)),
    ];
    const newAddresses = uniqueAddresses.filter(
      (addr) => !settledAddresses.has(addr) && !loadingAddresses.has(addr),
    );
    if (newAddresses.length === 0) return;

    const fetchActivities = async () => {
      const requestGeneration = generation;
      setLoadingAddresses((prev) => new Set([...prev, ...newAddresses]));
      // One address failing must not discard the activity of the others.
      const results = await Promise.allSettled(
        newAddresses.map(async (addr) => {
          const result = await queryClient.fetchQuery(
            proposalsActivityQueryOptions(
              daoId.toLowerCase() as ProposalsActivityPathParamsDaoEnumKey,
              {
                address: addr,
                // `!= null`, not truthy: MAX sends `fromDate: 0` as an
                // explicit all-time floor and it has to reach the API.
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
      // would put the previous range's counts back on the rows.
      if (currentGeneration.current !== requestGeneration) return;
      setActivities((prev) => {
        const next = new Map(prev);
        results.forEach((result) => {
          if (result.status !== "fulfilled" || !result.value.activity) return;
          const { address, activity } = result.value;
          next.set(address, {
            totalProposals: activity.totalProposals,
            votedProposals: activity.votedProposals,
            neverVoted: activity.neverVoted,
            avgTimeBeforeEnd: activity.avgTimeBeforeEnd,
          });
        });
        return next;
      });
      setSettledAddresses((prev) => new Set([...prev, ...newAddresses]));
      setLoadingAddresses((prev) => {
        const next = new Set(prev);
        newAddresses.forEach((addr) => next.delete(addr));
        return next;
      });
    };
    void fetchActivities();
  }, [
    addressesKey,
    settledAddresses,
    loadingAddresses,
    queryClient,
    fromDate,
    toDate,
    daoId,
    generation,
  ]);

  const activityFor = useCallback(
    (address: string) => activities.get(address),
    [activities],
  );

  const isActivityLoadingFor = useCallback(
    (address: string) => loadingAddresses.has(address),
    [loadingAddresses],
  );

  return useMemo(
    () => ({ activityFor, isActivityLoadingFor }),
    [activityFor, isActivityLoadingFor],
  );
};
