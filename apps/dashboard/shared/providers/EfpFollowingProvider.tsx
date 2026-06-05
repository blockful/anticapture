"use client";

import { postEfpFollowingInSet } from "@anticapture/client";
import { useQueries } from "@tanstack/react-query";
import type { Address } from "viem";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";

const EFP_FOLLOWING_IN_SET_MAX = 100;
const EFP_FOLLOWING_STALE_MS = 5 * 60 * 1000;
const TARGETS_DEBOUNCE_MS = 50;

type EfpFollowingContextValue = {
  registerTarget: (address: string) => void;
  unregisterTarget: (address: string) => void;
  /** `undefined` while the batch request is in flight for this address. */
  getViewerFollows: (address: string) => boolean | undefined;
};

const EfpFollowingContext = createContext<EfpFollowingContextValue | null>(
  null,
);

const chunk = <T,>(items: T[], size: number): T[][] => {
  if (items.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const useEfpFollowingBatch = (): EfpFollowingContextValue | null =>
  useContext(EfpFollowingContext);

export const EfpFollowingProvider = ({ children }: { children: ReactNode }) => {
  const { address: viewerAddress } = useAccount();
  const [targetRefCounts, setTargetRefCounts] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [debouncedTargets, setDebouncedTargets] = useState<string[]>([]);

  const registerTarget = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    setTargetRefCounts((prev) => {
      const next = new Map(prev);
      next.set(normalized, (prev.get(normalized) ?? 0) + 1);
      return next;
    });
  }, []);

  const unregisterTarget = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    setTargetRefCounts((prev) => {
      const count = prev.get(normalized);
      if (!count) {
        return prev;
      }
      const next = new Map(prev);
      if (count <= 1) {
        next.delete(normalized);
      } else {
        next.set(normalized, count - 1);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedTargets(Array.from(targetRefCounts.keys()).sort());
    }, TARGETS_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [targetRefCounts]);

  const batches = useMemo(
    () => chunk(debouncedTargets, EFP_FOLLOWING_IN_SET_MAX),
    [debouncedTargets],
  );

  const batchQueries = useQueries({
    queries: batches.map((addresses) => ({
      queryKey: [
        "efp",
        "following-in-set",
        viewerAddress?.toLowerCase(),
        addresses,
      ] as const,
      queryFn: () =>
        postEfpFollowingInSet({
          viewer: viewerAddress!.toLowerCase() as Address,
          addresses: addresses as Address[],
        }),
      enabled: !!viewerAddress && addresses.length > 0,
      staleTime: EFP_FOLLOWING_STALE_MS,
    })),
  });

  const followedSet = useMemo(() => {
    const set = new Set<string>();
    for (const query of batchQueries) {
      for (const address of query.data?.followed ?? []) {
        set.add(address.toLowerCase());
      }
    }
    return set;
  }, [batchQueries]);

  const isBatchLoading = batchQueries.some((query) => query.isPending);

  const getViewerFollows = useCallback(
    (address: string): boolean | undefined => {
      if (!viewerAddress) {
        return false;
      }

      const normalized = address.toLowerCase();
      if (!targetRefCounts.has(normalized)) {
        return undefined;
      }

      if (isBatchLoading) {
        return undefined;
      }

      return followedSet.has(normalized);
    },
    [viewerAddress, targetRefCounts, isBatchLoading, followedSet],
  );

  const value = useMemo(
    () => ({
      registerTarget,
      unregisterTarget,
      getViewerFollows,
    }),
    [registerTarget, unregisterTarget, getViewerFollows],
  );

  return (
    <EfpFollowingContext.Provider value={value}>
      {children}
    </EfpFollowingContext.Provider>
  );
};
