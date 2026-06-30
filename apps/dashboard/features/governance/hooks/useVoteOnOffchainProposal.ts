"use client";

import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";

import { getSnapshotVoteSignType } from "@/features/governance/utils/offchainVotingType";
import { encryptChoice } from "@/features/governance/utils/shutter";

const HUB_URL = "https://hub.snapshot.org";

type VoteChoice = number | number[] | Record<string, number>;

/**
 * Snapshot stores the privacy mode on the proposal, not in the vote envelope.
 * It is not surfaced by our API, so read it from the hub before voting:
 * shutter proposals require the choice to be Shutter-encrypted.
 */
const fetchProposalPrivacy = async (
  proposalId: string,
): Promise<string | null> => {
  try {
    const res = await fetch(`${HUB_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query Privacy($id: String!) { proposal(id: $id) { privacy } }`,
        variables: { id: proposalId },
      }),
    });
    if (!res.ok) return null;
    const json: { data?: { proposal?: { privacy?: string | null } | null } } =
      await res.json();
    return json.data?.proposal?.privacy ?? null;
  } catch {
    return null;
  }
};

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

      const isShutter =
        (await fetchProposalPrivacy(params.proposalId)) === "shutter";
      const choice = isShutter
        ? await encryptChoice(JSON.stringify(params.choice), params.proposalId)
        : params.choice;

      await client.vote(web3, address, {
        space: params.spaceId,
        proposal: params.proposalId,
        type: getSnapshotVoteSignType(params.proposalType),
        choice,
        reason: params.reason ?? "",
        app: "anticapture",
        ...(isShutter ? { privacy: "shutter" } : {}),
      });
    },
  });

  return { vote, error, isPending };
};
