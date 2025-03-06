import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

interface CexSupplyPromise {
  oldCexSupply: string;
  currentCexSupply: string;
  changeRate: string;
}

/* Fetch Dao Cex Supply */
export const fetchCexSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<CexSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/cex-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

/**
 * SWR hook to fetch and manage CEX supply data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with CEX supply data
 */
export const useCexSupply = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<CexSupplyPromise, Error>>,
) => {
  const key = daoId && days ? [`cexSupply`, daoId, days] : null;

  return useSWR<CexSupplyPromise>(
    key,
    async () => {
      return await fetchCexSupply({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
