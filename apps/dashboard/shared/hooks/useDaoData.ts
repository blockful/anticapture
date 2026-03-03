import {
  useGetDaoDataQuery,
  GetDaoDataQuery,
} from "@anticapture/graphql-client/hooks";

import { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

interface UseDaoDataResult {
  data: GetDaoDataQuery["dao"] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDaoData = (daoId: DaoIdEnum): UseDaoDataResult => {
  const { data, loading, error, refetch } = useGetDaoDataQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  return {
    data: data?.dao || null,
    loading,
    error: error || null,
    refetch,
  };
};
