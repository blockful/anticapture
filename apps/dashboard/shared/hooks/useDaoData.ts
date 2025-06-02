import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DAO, DaoIdEnum } from "@/shared/types/daos";
import useSWR from "swr";
import axios from "axios";

export const fetchDaoData = async (daoId: DaoIdEnum): Promise<DAO> => {
  const query = `query GetDaoData {
    dao(id: "${daoId}") {
      id
      quorum
      proposalThreshold
      votingDelay
      votingPeriod  
      timelockDelay
    }
  }`;
  const response: { data: { data: { dao: DAO } } } = await axios.post(
    `${BACKEND_ENDPOINT}`,
    { query },
  );
  const { dao } = response.data.data as {
    dao: DAO;
  };
  return dao as DAO;
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
