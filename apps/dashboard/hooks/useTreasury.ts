import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

// TODO: Should have Promise in the name of the object, use "Response" Instead
interface TreasuryPromise {
  oldTreasury: string;
  currentTreasury: string;
  changeRate: string;
}

/* Fetch Treasury Supply */
export const fetchTreasury = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<TreasuryPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/treasury/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

/**
 * SWR hook to fetch and manage treasury data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with treasury data
 */
export const useTreasury = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<TreasuryPromise, Error>>,
) => {
  const key = daoId && days ? [`treasury`, daoId, days] : null;

  return useSWR<TreasuryPromise>(
    key,
    async () => {
      return await fetchTreasury({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
