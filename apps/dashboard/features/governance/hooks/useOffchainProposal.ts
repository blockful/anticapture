import type { OffchainProposalByIdPathParamsDaoEnumKey } from "@anticapture/client";
import type { OffchainProposal } from "@anticapture/client";
import { useOffchainProposalById } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseOffchainProposalResult {
  proposal: OffchainProposal | null;
  loading: boolean;
  error: Error | null;
}

export interface UseOffchainProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
}

export const useOffchainProposal = ({
  proposalId,
  daoId,
}: UseOffchainProposalParams): UseOffchainProposalResult => {
  const { data, isLoading, error } = useOffchainProposalById(
    daoId.toLowerCase() as OffchainProposalByIdPathParamsDaoEnumKey,
    proposalId,
    undefined,
    { query: { enabled: !!proposalId } },
  );

  return {
    proposal: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error : null,
  };
};
