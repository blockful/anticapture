import { useMemo } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetProposalQuery,
  useGetProposalQuery,
} from "@anticapture/graphql-client/hooks";
import { getProposalStatus } from "@/features/governance/utils";

export interface UseProposalResult {
  proposal: GetProposalQuery["proposal"] | null;
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
    if (!data?.proposal) {
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
