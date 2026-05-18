import {
  orderDirectionEnum,
  type ProposalsPathParams,
  type ResponseErrorConfig,
} from "@anticapture/client";
import { useProposals } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { transformToGovernanceProposal } from "@/features/governance/utils/transformToGovernanceProposal";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseLastProposalsResult {
  proposals: GovernanceProposal[];
  loading: boolean;
  error: ResponseErrorConfig<Error> | null;
}

const LAST_PROPOSALS_LIMIT = 3;

/**
 * Hook to fetch the last 3 proposals for a DAO.
 * This is a simplified version of useProposals without pagination.
 */
export const useLastProposals = (daoId: DaoIdEnum): UseLastProposalsResult => {
  const { decimals } = daoConfig[daoId];

  const { data, isLoading, error } = useProposals(
    daoId.toLowerCase() as ProposalsPathParams["dao"],
    {
      limit: LAST_PROPOSALS_LIMIT,
      orderDirection: orderDirectionEnum.desc,
    },
  );

  const proposals = useMemo(() => {
    return (data?.items ?? []).map((proposal) =>
      transformToGovernanceProposal(proposal, decimals),
    );
  }, [data, decimals]);

  return {
    proposals,
    loading: isLoading,
    error: error ?? null,
  };
};
