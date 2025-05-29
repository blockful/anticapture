import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
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
  const query = `query Votes {
    compareVotes(daoId: ${daoId}, days: _${days}) {
      votes
    }
  }`;
  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query,
    }),
  });
  const { compareVotes } = (await response.json()) as {
    compareVotes: VotesResponse;
  };
  return compareVotes;
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
