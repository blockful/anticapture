import type { ProposalPathParamsDaoEnumKey } from "@anticapture/client";
import { useProposal as useProposalSDK } from "@anticapture/client/hooks";

import type { ProposalDetails } from "@/features/governance/types";
import { getProposalStatus } from "@/features/governance/utils";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseProposalResult {
  data: ProposalDetails | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseProposalParams {
  proposalId: string;
  daoId: DaoIdEnum;
}

export const useProposal = ({
  proposalId,
  daoId,
}: UseProposalParams): UseProposalResult => {
  const daoKey = daoId.toLowerCase() as ProposalPathParamsDaoEnumKey;
  const { data, isLoading, error } = useProposalSDK(
    daoKey,
    proposalId,
    {},
    { query: { enabled: !!proposalId } },
  );

  const full = data?.variant === "full" ? data : null;

  return {
    data: full
      ? {
          ...full,
          status: getProposalStatus(full.status),
          quorum: full.quorum.toString(),
          forVotes: full.forVotes.toString(),
          againstVotes: full.againstVotes.toString(),
          abstainVotes: full.abstainVotes.toString(),
          calldatas: full.calldatas,
          targets: full.targets,
          values: full.values.map((value) => value.toString()),
        }
      : null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
};
