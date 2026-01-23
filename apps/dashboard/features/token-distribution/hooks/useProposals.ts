import { DaoIdEnum } from "@/shared/types/daos";
import { useGetProposalsQuery } from "@anticapture/graphql-client/hooks";

export const useProposals = (daoId: DaoIdEnum, fromDate: string) => {
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
