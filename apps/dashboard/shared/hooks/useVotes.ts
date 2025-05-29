import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

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
  const query = `query Votes {
    compareVotes(daoId: ${daoId}, days: _${days}) {
      currentVotes
      oldVotes
      changeRate
    }
  }`;
  const response: { data: { data: { compareVotes: VotesResponse } } } = await axios.post(`${BACKEND_ENDPOINT}`, {
      query,
    },
  );
  const { compareVotes } = response.data.data as {
    compareVotes: VotesResponse;
  };
  return compareVotes as VotesResponse;
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
