import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import daoConfigByDaoId from "@/shared/dao-config";
import axios from "axios";

interface ActiveSupplyResponse {
  activeSupply: string;
}

/* Fetch Active Supply */
export const fetchActiveSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<ActiveSupplyResponse | null> => {
  const query = `query ActiveSupply {
    compareActiveSupply(daoId: ${daoId}, days: _${days}) {
      activeSupply
    }
  }`;

  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }
  const response: { data: { data: { compareActiveSupply: ActiveSupplyResponse } } } =
    await axios.post(`${BACKEND_ENDPOINT}`, { query });
  const { compareActiveSupply } = response.data.data as {
    compareActiveSupply: ActiveSupplyResponse;
  };
  return compareActiveSupply as ActiveSupplyResponse;
};

/**
 * SWR hook to fetch and manage active supply data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with active supply data
 */
export const useActiveSupply = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<ActiveSupplyResponse | null, Error>>,
) => {
  const key = daoId && days ? [`activeSupply`, daoId, days] : null;

  return useSWR<ActiveSupplyResponse | null>(
    key,
    async () => {
      return await fetchActiveSupply({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
