import { useMemo } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import { useGetProposalQuery } from "@anticapture/graphql-client/hooks";
import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { transformToGovernanceProposal } from "@/features/governance/utils/transformToGovernanceProposal";

export interface UseProposalResult {
  proposal: GovernanceProposal | null;
  loading: boolean;
  error: ApolloError | undefined;
}

export interface UseProposalParams {
  proposalId: string;
}

export const useProposal = ({
  proposalId,
}: UseProposalParams): UseProposalResult => {
  // Main proposal query
  const { data, loading, error } = useGetProposalQuery({
    variables: {
      id: proposalId,
    },
    context: {
      headers: {
        "anticapture-dao-id": DaoIdEnum.ENS,
      },
    },
    skip: !proposalId, // Skip query if no proposalId provided
  });

  // Transform raw GraphQL data to governance proposal format
  const proposal = useMemo(() => {
    if (!data?.proposal) {
      return null;
    }

    const rawProposal = data.proposal;

    // Transform the raw proposal data to match the expected format
    const transformedData = {
      id: rawProposal.id,
      daoId: rawProposal.daoId,
      txHash: rawProposal.txHash,
      description: rawProposal.description,
      forVotes: rawProposal.forVotes,
      againstVotes: rawProposal.againstVotes,
      abstainVotes: rawProposal.abstainVotes,
      timestamp: rawProposal.timestamp,
      status: rawProposal.status,
      proposerAccountId: rawProposal.proposerAccountId,
      title: rawProposal.title || "",
      endTimestamp: rawProposal.endTimestamp,
      quorum: rawProposal.quorum,
      startTimestamp: rawProposal.startTimestamp,
    };

    return transformToGovernanceProposal(transformedData);
  }, [data]);

  return {
    proposal,
    loading,
    error,
  };
};
