import { DaoIdEnum } from "@/shared/types/daos";
import { useGetProposalsQuery } from "@anticapture/graphql-client/hooks";

export const useProposals = (daoId: DaoIdEnum, fromDate: number) => {
  const { data, loading, error } = useGetProposalsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      fromDate,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  return { data, loading, error };
};
