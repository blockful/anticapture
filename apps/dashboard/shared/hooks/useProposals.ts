import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

interface ProposalsResponse {
  currentProposalsLaunched: string;
  oldProposalsLaunched: string;
  changeRate: string;
}

/* Fetch Proposals */
export const fetchProposals = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<ProposalsResponse> => {
  const response: Response = await fetch(
    `${BACKEND_ENDPOINT}/dao/${daoId}/proposals/compare?days=${days}`,
    { next: { revalidate: 3600 } },
  );
  return response.json();
};

/**
 * SWR hook to fetch and manage proposals data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with proposals data
 */
export const useProposals = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<ProposalsResponse, Error>>,
) => {
  const key = daoId && days ? [`proposals`, daoId, days] : null;

  return useSWR<ProposalsResponse>(
    key,
    async () => {
      return await fetchProposals({ daoId, days });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
