import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
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
  const query = `query Proposals {
    compareProposals(daoId: ${daoId}, days: _${days}) {
        currentProposalsLaunched
        oldProposalsLaunched
        changeRate
    }
  }`;
  const response = await fetch(`${BACKEND_ENDPOINT}`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query,
    }),
  });
  const { compareProposals } = (await response.json()) as {
    compareProposals: ProposalsResponse;
  };
  return compareProposals;
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
