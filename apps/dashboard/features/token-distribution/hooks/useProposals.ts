import { DaoIdEnum } from "@/shared/types/daos";
import { useGetProposalsQuery } from "@anticapture/graphql-client/hooks";

export const useProposals = (daoId: DaoIdEnum) => {
  const { data, loading, error } = useGetProposalsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return { data, loading, error };
};
