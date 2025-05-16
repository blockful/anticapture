import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import daoConfigByDaoId from "@/shared/dao-config";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";

interface AverageTurnoutResponse {
  currentAverageTurnout: string;
  oldAverageTurnout: string;
  changeRate: string;
}

/* Fetch Average Turnout */
export const fetchAverageTurnout = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<AverageTurnoutResponse | null> => {
  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }
  const response: Response = await fetch(
    `${BACKEND_ENDPOINT}/dao/${daoId}/average-turnout/compare?days=${days}`,
    { next: { revalidate: 3600 } },
  );
  return response.json();
};

/**
 * SWR hook to fetch and manage average turnout data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with average turnout data
 */
export const useAverageTurnout = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<AverageTurnoutResponse | null, Error>>,
) => {
  const key = daoId && days ? [`averageTurnout`, daoId, days] : null;

  return useSWR<AverageTurnoutResponse | null>(
    key,
    async () => {
      return await fetchAverageTurnout({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
