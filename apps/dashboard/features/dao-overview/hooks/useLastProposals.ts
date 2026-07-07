import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { useProposals } from "@/features/governance/hooks/useProposals";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseLastProposalsResult {
  proposals: GovernanceProposal[];
  loading: boolean;
  error: Error | null;
}

const LAST_PROPOSALS_LIMIT = 3;

/**
 * Hook to fetch the last 3 proposals for a DAO.
 * This is a simplified version of useProposals without pagination.
 */
export const useLastProposals = (daoId: DaoIdEnum): UseLastProposalsResult => {
  const { data, isLoading, error } = useProposals({
    daoId,
    limit: LAST_PROPOSALS_LIMIT,
    lean: true,
  });

  return {
    proposals: data.slice(0, LAST_PROPOSALS_LIMIT),
    loading: isLoading,
    error,
  };
};
