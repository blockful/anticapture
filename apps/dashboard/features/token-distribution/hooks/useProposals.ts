import { useGetProposalsQuery } from "@anticapture/graphql-client/hooks";

import { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export const useProposals = (daoId: DaoIdEnum, fromDate: number) => {
  return useGetProposalsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    variables: {
      fromDate,
      limit: 1000,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
};
