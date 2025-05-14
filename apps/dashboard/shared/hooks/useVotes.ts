import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

interface VotesResponse {
  currentVotes: string;
  oldVotes: string;
  changeRate: string;
}

/* Fetch Votes */
export const fetchVotes = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<VotesResponse> => {
  const response: Response = await fetch(
    `${BACKEND_ENDPOINT}/dao/${daoId}/votes/compare?days=${days}`,
    { next: { revalidate: 3600 } },
  );
  return response.json();
};

/**
 * SWR hook to fetch and manage votes data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with votes data
 */
export const useVotes = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<VotesResponse, Error>>,
) => {
  const key = daoId && days ? [`votes`, daoId, days] : null;

  return useSWR<VotesResponse>(
    key,
    async () => {
      return await fetchVotes({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
