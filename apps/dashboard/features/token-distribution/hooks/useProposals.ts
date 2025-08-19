import { DaoIdEnum } from "@/shared/types/daos";
import { useGetProposalsOnChainQuery } from "@anticapture/graphql-client/hooks";

export const useProposals = (daoId: DaoIdEnum) => {
  const { data, loading, error } = useGetProposalsOnChainQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return { data, loading, error };
};
