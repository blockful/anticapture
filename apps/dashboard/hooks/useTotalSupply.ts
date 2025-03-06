import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";

interface TotalSupplyPromise {
  oldTotalSupply: string;
  currentTotalSupply: string;
  changeRate: string;
}

/* Fetch Dao Total Supply */
// TODO: Seems like this is not used anywhere
export const fetchTotalSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}) => {
  return new Promise<TotalSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoId}/total-supply/compare?days=${days}`,
        { next: { revalidate: 3600 } },
      );
      const totalSupplyData = await response.json();
      res(totalSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

/**
 * SWR hook to fetch total supply data for a DAO
 * @param daoId - The ID of the DAO
 * @param days - Number of days to compare
 * @param options - Additional SWR options
 * @returns SWR response with total supply data
 */
export const useFetchTotalSupply = (
  daoId: DaoIdEnum,
  days: string,
  options?: Partial<import("swr").SWRConfiguration<TotalSupplyPromise, any>>,
) => {
  const fetcher = () => fetchTotalSupply({ daoId, days });

  return useSWR<TotalSupplyPromise>(
    daoId && days ? [`totalSupply`, daoId, days] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );
};
