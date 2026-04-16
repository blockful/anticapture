import { useGetProposalQuery } from "@anticapture/graphql-client/hooks";
import type { ApolloError } from "@apollo/client";
import { useMemo } from "react";

import type { ProposalDetails } from "@/features/governance/types";
import { getProposalStatus } from "@/features/governance/utils";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseProposalResult {
  proposal: ProposalDetails | null;
  loading: boolean;
  error: ApolloError | undefined;
}

export interface UseProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
}

export const useProposal = ({
  proposalId,
  daoId,
}: UseProposalParams): UseProposalResult => {
  // Main proposal query
  const { data, loading, error } = useGetProposalQuery({
    variables: {
      id: proposalId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !proposalId, // Skip query if no proposalId provided
  });

  // Transform raw GraphQL data to governance proposal format
  const proposal = useMemo(() => {
    if (!data?.proposal || data.proposal.__typename !== "OnchainProposal") {
      return null;
    }

    return {
      ...data.proposal,
      status: getProposalStatus(data.proposal.status),
    };
  }, [data]);

  return {
    proposal,
    loading,
    error,
  };
};
