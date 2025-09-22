import { useMemo } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetProposalQuery,
  useGetProposalQuery,
} from "@anticapture/graphql-client/hooks";

export interface UseProposalResult {
  proposal: GetProposalQuery["proposal"] | null;
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

    return data.proposal;
  }, [data]);

  return {
    proposal,
    loading,
    error,
  };
};
