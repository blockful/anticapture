import { useGetDaoDataQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

interface UseDaoDataResult {
  data:
    | (NonNullable<ReturnType<typeof useGetDaoDataQuery>["data"]>["dao"] & {
        id: DaoIdEnum;
      })
    | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDaoData = (daoId: DaoIdEnum): UseDaoDataResult => {
  const { data, loading, error, refetch } = useGetDaoDataQuery({
    variables: { daoId },
  });

  return {
    data: data?.dao ? { ...data.dao, id: daoId } : null,
    loading,
    error: error || null,
    refetch,
  };
};
