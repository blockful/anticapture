import axios from "axios";
import useSWR, { SWRConfiguration } from "swr";

import { DaoIdEnum } from "@/shared/types/daos";
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
  const query = `query AverageTurnout {
    compareAverageTurnout(days: _${days}) {
        currentAverageTurnout
        oldAverageTurnout
        changeRate
    }
  }`;
  const response = await axios.post<{
    data: { compareAverageTurnout: AverageTurnoutResponse };
  }>(
    `${process.env.NEXT_PUBLIC_BASE_URL}`,
    { query },
    {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  );
  return response.data.data.compareAverageTurnout;
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
  return useSWR<AverageTurnoutResponse | null>(
    [`averageTurnout`, daoId, days],
    async () => await fetchAverageTurnout({ daoId, days }),
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
