import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

// TODO: Should have Promise in the name of the object, use "Response" Instead
interface LendingSupplyPromise {
  oldLendingSupply: string;
  currentLendingSupply: string;
  changeRate: string;
}

/* Fetch Lending Supply */
export const fetchLendingSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<LendingSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/lending-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

/**
 * SWR hook to fetch and manage lending supply data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with lending supply data
 */
export const useLendingSupply = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<LendingSupplyPromise, Error>>,
) => {
  const key = daoId && days ? [`lendingSupply`, daoId, days] : null;

  return useSWR<LendingSupplyPromise>(
    key,
    async () => {
      return await fetchLendingSupply({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
