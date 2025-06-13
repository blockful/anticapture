import { useGetDaoDataQuery } from "@anticapture/graphql-client/react";
import { DaoIdEnum } from "@/shared/types/daos";

interface UseDaoDataResult {
  data: any | null; // You can type this more specifically based on your DAO type
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDaoData = (daoId: DaoIdEnum): UseDaoDataResult => {
  const { data, loading, error, refetch } = useGetDaoDataQuery({
    variables: { daoId },
  });

  return {
    data: data?.dao || null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
