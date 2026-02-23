import { useGetProposalsQuery } from "@anticapture/graphql-client/hooks";

import { DaoIdEnum } from "@/shared/types/daos";

export const useProposals = (daoId: DaoIdEnum, fromDate: number) => {
  return useGetProposalsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
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
