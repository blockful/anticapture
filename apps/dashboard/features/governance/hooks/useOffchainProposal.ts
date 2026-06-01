import { useOffchainProposalById } from "@anticapture/client/hooks";
import type { OffchainProposalByIdPathParamsDaoEnumKey } from "@anticapture/client";

import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseOffchainProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
}

export const useOffchainProposal = ({
  proposalId,
  daoId,
}: UseOffchainProposalParams) => {
  const { data, isLoading, error } = useOffchainProposalById(
    daoId.toLowerCase() as OffchainProposalByIdPathParamsDaoEnumKey,
    proposalId,
    undefined,
  );

  return {
    proposal: data,
    loading: isLoading,
    error,
  };
};
