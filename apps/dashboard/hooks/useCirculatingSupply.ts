import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

interface CirculatingSupplyPromise {
  oldCirculatingSupply: string;
  currentCirculatingSupply: string;
  changeRate: string;
}

/* Fetch Dao Circulating Supply */
export const fetchCirculatingSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<CirculatingSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/circulating-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

/**
 * SWR hook to fetch and manage circulating supply data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with circulating supply data
 */
export const useCirculatingSupply = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<CirculatingSupplyPromise, Error>>,
) => {
  const key = daoId && days ? [`circulatingSupply`, daoId, days] : null;

  return useSWR<CirculatingSupplyPromise>(
    key,
    async () => {
      return await fetchCirculatingSupply({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
