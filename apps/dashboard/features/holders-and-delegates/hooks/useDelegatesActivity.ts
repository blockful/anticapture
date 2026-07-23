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

  const addressesKey = addresses.join(",");

  useEffect(() => {
    setActivities(new Map());
    setLoadingAddresses(new Set());
  }, [fromDate, daoId]);

  useEffect(() => {
    const uniqueAddresses = [
      ...new Set(addressesKey.split(",").filter(Boolean)),
    ];
    const newAddresses = uniqueAddresses.filter(
      (addr) => !activities.has(addr) && !loadingAddresses.has(addr),
    );
    if (newAddresses.length === 0) return;

    const fetchActivities = async () => {
      setLoadingAddresses((prev) => new Set([...prev, ...newAddresses]));
      try {
        const results = await Promise.all(
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
          results.forEach(({ address, activity }) => {
            if (activity) {
              next.set(address, {
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
        setLoadingAddresses((prev) => {
          const next = new Set(prev);
          newAddresses.forEach((addr) => next.delete(addr));
          return next;
        });
      }
    };
    void fetchActivities();
  }, [
    addressesKey,
    activities,
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
