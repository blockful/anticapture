"use client";

import type { VotesOffchainByProposalIdPathParamsDaoEnumKey } from "@anticapture/client";
import { useVotesOffchainByProposalId } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

interface UseMyOffchainVoteParams {
  daoId: DaoIdEnum;
  proposalId: string;
  address?: string;
}

/**
 * The connected wallet's vote on an off-chain proposal, if any. Drives the
 * "You voted" chip and the read-only voted modal, which previously had no way
 * to know a prior choice existed.
 */
export const useMyOffchainVote = ({
  daoId,
  proposalId,
  address,
}: UseMyOffchainVoteParams) => {
  const { data, isLoading, refetch } = useVotesOffchainByProposalId(
    daoId.toLowerCase() as VotesOffchainByProposalIdPathParamsDaoEnumKey,
    proposalId,
    { voterAddresses: address ? [address] : undefined, limit: 1 },
    { query: { enabled: !!proposalId && !!address } },
  );

  const vote = data?.items?.[0] ?? null;

  return {
    vote,
    hasVoted: vote !== null,
    isLoading,
    refetch,
  };
};
