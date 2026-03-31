"use client";

import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";

const HUB_URL = "https://hub.snapshot.org";

type VoteChoice = number | number[] | Record<string, number>;

type SnapshotProposalType =
  | "basic"
  | "single-choice"
  | "approval"
  | "ranked-choice"
  | "weighted"
  | "quadratic";

interface VoteParams {
  spaceId: string;
  proposalId: string;
  type: SnapshotProposalType;
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

      await client.vote(web3, address, {
        space: params.spaceId,
        proposal: params.proposalId,
        type: params.type,
        choice: params.choice,
        reason: params.reason ?? "",
        app: "anticapture",
      });
    },
  });

  return { vote, error, isPending };
};
