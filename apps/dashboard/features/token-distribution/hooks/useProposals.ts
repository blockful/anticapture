import { DaoIdEnum } from "@/shared/types/daos";
import { useGetProposalsQuery } from "@anticapture/graphql-client/hooks";

export const useProposals = (daoId: DaoIdEnum, fromDate: number) => {
  console.log("fromDate", fromDate);
  const { data, loading, error } = useGetProposalsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      fromDate,
    },
  });
  console.log("data", data);
  console.log("loading", loading);
  console.log("error", error);
  return { data, loading, error };
};
