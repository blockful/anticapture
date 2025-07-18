import {
  useGetDaoDataQuery,
  GetDaoDataQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

interface UseDaoDataResult {
  data: GetDaoDataQuery["dao"] | null;
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
    refetch,
  };
};
