"use client";

import snapshot from "@snapshot-labs/snapshot.js";
import { useEffect, useState } from "react";

interface SnapshotStrategy {
  name: string;
  network: string;
  params: Record<string, unknown>;
}

interface UseOffchainVotingPowerParams {
  address: string | undefined;
  spaceId: string;
  proposalId: string;
  snapshot: number | null | undefined;
  strategies: SnapshotStrategy[] | null | undefined;
  network: string | null | undefined;
}

interface UseOffchainVotingPowerResult {
  votingPower: number;
  isLoading: boolean;
  error: string | null;
}

export const useOffchainVotingPower = (
  params: UseOffchainVotingPowerParams,
): UseOffchainVotingPowerResult => {
  const {
    address,
    spaceId,
    proposalId,
    snapshot: snapshotBlock,
    strategies,
    network,
  } = params;

  const [votingPower, setVotingPower] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !spaceId || !strategies || !network) {
      setVotingPower(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchVotingPower = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const blockOrLatest: number | "latest" =
          snapshotBlock != null ? snapshotBlock : "latest";

        const result = await snapshot.utils.getVp(
          address,
          network,
          strategies,
          blockOrLatest,
          spaceId,
          false,
        );

        if (!cancelled) {
          const vp =
            typeof (result as { vp?: unknown }).vp === "number"
              ? (result as { vp: number }).vp
              : 0;
          setVotingPower(vp);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch voting power";
          setError(message);
          setVotingPower(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchVotingPower();

    return () => {
      cancelled = true;
    };
  }, [address, spaceId, proposalId, snapshotBlock, strategies, network]);

  return { votingPower, isLoading, error };
};
