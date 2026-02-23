import {
  QueryInput_Proposals_OrderDirection,
  useGetProposalsFromDaoQuery,
} from "@anticapture/graphql-client/hooks";
import { ApolloError } from "@apollo/client";
import { useMemo } from "react";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { transformToGovernanceProposal } from "@/features/governance/utils/transformToGovernanceProposal";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

export interface UseLastProposalsResult {
  proposals: GovernanceProposal[];
  loading: boolean;
  error: ApolloError | undefined;
}

const LAST_PROPOSALS_LIMIT = 3;

/**
 * Hook to fetch the last 3 proposals for a DAO.
 * This is a simplified version of useProposals without pagination.
 */
export const useLastProposals = (daoId: DaoIdEnum): UseLastProposalsResult => {
  const { decimals } = daoConfig[daoId];

  const { data, loading, error } = useGetProposalsFromDaoQuery({
    variables: {
      skip: 0,
      limit: LAST_PROPOSALS_LIMIT,
      orderDirection: QueryInput_Proposals_OrderDirection.Desc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  const proposals = useMemo(() => {
    const rawProposals = data?.proposals?.items || [];

    return rawProposals
      .filter((proposal) => proposal !== null)
      .map((proposal) => transformToGovernanceProposal(proposal, decimals));
  }, [data, decimals]);

  return {
    proposals,
    loading,
    error,
  };
};
