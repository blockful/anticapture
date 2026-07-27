"use client";

import type { ProposalsActivityPathParamsDaoEnumKey } from "@anticapture/client";
import { proposalsActivityQueryOptions } from "@anticapture/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ProposalsActivity } from "@/features/holders-and-delegates/hooks/useDelegates";
import type { DaoIdEnum } from "@/shared/types/daos";

interface UseDelegatesActivityParams {
  daoId: DaoIdEnum;
  addresses: string[];
  fromDate?: number;
}

// Fetches proposals-activity per delegate address (deduped by React Query's
// cache) so tables can flag inactive delegates without a bulk endpoint.
export const useDelegatesActivity = ({
  daoId,
  addresses,
  fromDate,
}: UseDelegatesActivityParams) => {
  const queryClient = useQueryClient();

  const [activities, setActivities] = useState<Map<string, ProposalsActivity>>(
    () => new Map(),
  );
  const [loadingAddresses, setLoadingAddresses] = useState<Set<string>>(
    () => new Set(),
  );
  // Addresses whose fetch already settled, successfully or not. `activities`
  // alone cannot play this role: a rejected (or empty) response leaves no entry
  // there, and since this effect depends on both sets, releasing the address
  // from `loadingAddresses` would immediately re-select it and refetch it in a
  // loop for as long as the endpoint keeps failing.
  const [settledAddresses, setSettledAddresses] = useState<Set<string>>(
    () => new Set(),
  );

  const addressesKey = addresses.join(",");

  useEffect(() => {
    setActivities(new Map());
    setLoadingAddresses(new Set());
    setSettledAddresses(new Set());
  }, [fromDate, daoId]);

  useEffect(() => {
    const uniqueAddresses = [
      ...new Set(addressesKey.split(",").filter(Boolean)),
    ];
    const newAddresses = uniqueAddresses.filter(
      (addr) => !settledAddresses.has(addr) && !loadingAddresses.has(addr),
    );
    if (newAddresses.length === 0) return;

    const fetchActivities = async () => {
      setLoadingAddresses((prev) => new Set([...prev, ...newAddresses]));
      // One address failing must not discard the activity of the others.
      const results = await Promise.allSettled(
        newAddresses.map(async (addr) => {
          const result = await queryClient.fetchQuery(
            proposalsActivityQueryOptions(
              daoId.toLowerCase() as ProposalsActivityPathParamsDaoEnumKey,
              { address: addr, ...(fromDate ? { fromDate } : {}) },
            ),
          );
          return { address: addr, activity: result ?? null };
        }),
      );
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
    daoId,
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
