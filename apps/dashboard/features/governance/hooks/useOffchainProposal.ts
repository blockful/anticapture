import type {
  OffchainProposalByIdPathParams,
  OffchainProposalByIdQueryResponse,
  ResponseErrorConfig,
} from "@anticapture/client";
import { useOffchainProposalById } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseOffchainProposalResult {
  data: OffchainProposalByIdQueryResponse | null;
  isLoading: boolean;
  error: ResponseErrorConfig | null;
}

export interface UseOffchainProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
}

export const useOffchainProposal = ({
  proposalId,
  daoId,
}: UseOffchainProposalParams): UseOffchainProposalResult => {
  const query = useOffchainProposalById(
    daoId.toLowerCase() as OffchainProposalByIdPathParams["dao"],
    proposalId,
    {
      query: {
        enabled: !!proposalId,
      },
    },
  );

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
};
