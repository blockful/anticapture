import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DAO, DaoIdEnum } from "@/shared/types/daos";
import useSWR from "swr";

export const fetchDaoData = async (daoId: DaoIdEnum): Promise<DAO> => {
  const response = await fetch(`${BACKEND_ENDPOINT}/dao/${daoId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch DAO data: ${response.statusText}`);
  }
  return response.json();
};

interface UseDaoDataResult {
  data: DAO | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void | DAO>;
}

export const useDaoData = (daoId: DaoIdEnum): UseDaoDataResult => {
  const { data, error, isLoading, mutate } = useSWR<DAO>(
    daoId ? `dao/${daoId}` : null,
    () => fetchDaoData(daoId),
  );

  return {
    data: data || null,
    loading: isLoading,
    error: error || null,
    refetch: () => mutate(),
  };
};
