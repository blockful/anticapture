import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import daoConfigByDaoId from "@/shared/dao-config";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";

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
  const query = `query DelegatedSupply {
    compareDelegatedSupply(daoId: ${daoId}, days: _${days}) {
      oldDelegatedSupply
      currentDelegatedSupply
      changeRate
    }
  }`;
  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query,
    }),
  });
  const { compareDelegatedSupply } = (await response.json()) as {
    compareDelegatedSupply: DelegatedSupplyResponse;
  };
  return compareDelegatedSupply;
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
