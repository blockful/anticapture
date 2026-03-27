import type { GetOffchainProposalQuery } from "@anticapture/graphql-client/hooks";
import { useGetOffchainProposalQuery } from "@anticapture/graphql-client/hooks";
import type { ApolloError } from "@apollo/client";

import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export interface UseOffchainProposalResult {
  proposal: GetOffchainProposalQuery["offchainProposalById"] | null;
  loading: boolean;
  error: ApolloError | undefined;
}

export interface UseOffchainProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
}

export const useOffchainProposal = ({
  proposalId,
  daoId,
}: UseOffchainProposalParams): UseOffchainProposalResult => {
  const { data, loading, error } = useGetOffchainProposalQuery({
    variables: { id: proposalId },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    skip: !proposalId,
  });

  return { proposal: data?.offchainProposalById ?? null, loading, error };
};
