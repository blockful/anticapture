import type { ProposalsPathParamsDaoEnumKey } from "@anticapture/client";
import { useProposals as useProposalsSDK } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export const useProposals = (daoId: DaoIdEnum, fromDate: number) => {
  return useProposalsSDK(daoId.toLowerCase() as ProposalsPathParamsDaoEnumKey, {
    fromDate,
    limit: 1000,
    lean: true,
  });
};
