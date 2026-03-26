import type { GetProposalQuery } from "@anticapture/graphql-client/hooks";
import { useGetProposalQuery } from "@anticapture/graphql-client/hooks";
import type { ApolloError } from "@apollo/client";
import { useMemo } from "react";

import { getProposalStatus } from "@/features/governance/utils";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export interface UseProposalResult {
  proposal: GetProposalQuery["proposal"] | null;
  loading: boolean;
  error: ApolloError | undefined;
}

export interface UseProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
  skip?: boolean;
}

export const useProposal = ({
  proposalId,
  daoId,
  skip = false,
}: UseProposalParams): UseProposalResult => {
  // Main proposal query
  const { data, loading, error } = useGetProposalQuery({
    variables: {
      id: proposalId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    skip: skip || !proposalId,
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
