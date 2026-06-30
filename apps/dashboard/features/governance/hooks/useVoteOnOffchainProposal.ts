"use client";

import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";

import { offchainProposalPrivacyQueryOptions } from "@/features/governance/hooks/useOffchainProposalPrivacy";
import { getSnapshotVoteSignType } from "@/features/governance/utils/offchainVotingType";
import { encryptChoice } from "@/features/governance/utils/shutter";

const HUB_URL = "https://hub.snapshot.org";

type VoteChoice = number | number[] | Record<string, number>;

interface VoteParams {
  spaceId: string;
  proposalId: string;
  /** Snapshot proposal type from the API (e.g. copeland, ranked-choice). */
  proposalType: string;
  choice: VoteChoice;
  reason?: string;
}

export const useVoteOnOffchainProposal = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const {
    mutateAsync: vote,
    error,
    isPending,
  } = useMutation({
    mutationFn: async (params: VoteParams) => {
      if (!address || !walletClient) {
        throw new Error("Wallet not connected");
      }

      const client = new snapshot.Client712(HUB_URL);
      const web3 = new Web3Provider(walletClient.transport);

      // Shares the cache with the modal's privacy query, so this usually
      // resolves without an extra request.
      const privacy = await queryClient.ensureQueryData(
        offchainProposalPrivacyQueryOptions(params.proposalId),
      );
      const isShutter = privacy === "shutter";
      const choice = isShutter
        ? await encryptChoice(JSON.stringify(params.choice), params.proposalId)
        : params.choice;

      await client.vote(web3, address, {
        space: params.spaceId,
        proposal: params.proposalId,
        type: getSnapshotVoteSignType(params.proposalType),
        choice,
        // A plaintext reason on a shutter ballot would leak the vote before
        // reveal, so drop it (Snapshot hides the field for these proposals).
        reason: isShutter ? "" : (params.reason ?? ""),
        app: "anticapture",
        ...(isShutter ? { privacy: "shutter" } : {}),
      });
    },
  });

  return { vote, error, isPending };
};
