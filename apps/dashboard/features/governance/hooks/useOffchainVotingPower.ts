"use client";

import type { OffchainProposal } from "@anticapture/client";
import snapshot from "@snapshot-labs/snapshot.js";
import { useQuery } from "@tanstack/react-query";

interface UseOffchainVotingPowerParams {
  address: string | undefined;
  spaceId: OffchainProposal["spaceId"];
  proposalId: OffchainProposal["id"];
  snapshot: OffchainProposal["snapshot"] | undefined;
  strategies: OffchainProposal["strategies"] | null | undefined;
  network: OffchainProposal["network"] | null | undefined;
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

  const query = useQuery({
    queryKey: [
      "offchain-voting-power",
      address,
      spaceId,
      proposalId,
      snapshotBlock,
      network,
      strategies,
    ],
    enabled: !!address && !!spaceId && !!strategies && !!network,
    queryFn: async () => {
      if (!address || !strategies || !network) {
        return 0;
      }

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

      return typeof (result as { vp?: unknown }).vp === "number"
        ? (result as { vp: number }).vp
        : 0;
    },
  });

  return {
    votingPower: query.data ?? 0,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Failed to fetch voting power"
          : null,
  };
};
