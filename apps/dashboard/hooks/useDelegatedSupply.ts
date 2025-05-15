
import daoConfigByDaoId from "@/lib/dao-config";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

interface DelegatedSupplyResponse {
  oldDelegatedSupply: string;
  currentDelegatedSupply: string;
  changeRate: string;
}

/* Fetch Dao Total Supply */
export const fetchDelegatedSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<DelegatedSupplyResponse | null> => {
  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }
  const response = await fetch(
    `${BACKEND_ENDPOINT}/dao/${daoId}/delegated-supply/compare?days=${days}`,
    { next: { revalidate: 3600 } },
  );
  return response.json();
};

/**
 * SWR hook to fetch and manage delegated supply data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with delegated supply data
 */
export const useDelegatedSupply = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<DelegatedSupplyResponse | null, Error>>,
) => {
  const key = daoId && days ? [`delegatedSupply`, daoId, days] : null;

  return useSWR<DelegatedSupplyResponse | null>(
    key,
    async () => {
      return await fetchDelegatedSupply({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
