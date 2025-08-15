import { DaoIdEnum } from "@/shared/types/daos";
import useSWR from "swr";
import axios from "axios";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import daoConfigByDaoId from "@/shared/dao-config";

const api = axios.create({
  baseURL: BACKEND_ENDPOINT,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

interface VotingPowerResponse {
  data: {
    accountPowers: {
      items: {
        votingPower: string;
      }[];
    };
  };
}

const fetchVetoCouncilVotingPower = async (
  daoId: DaoIdEnum,
): Promise<string | null> => {
  const accountId =
    daoConfigByDaoId[daoId].daoOverview.securityCouncil?.vetoCouncilAddress;

  const response = await api.post<VotingPowerResponse>("", {
    query: `
      query GetVetoCouncilVotingPower {
        accountPowers(where: {accountId: "${accountId}", daoId: "${daoId}"}) {
          items {
            votingPower
          }
        }
      }
    `,
  });

  return response.data.data.accountPowers.items[0]?.votingPower || null;
};

export const useVetoCouncilVotingPower = (daoId: DaoIdEnum) => {
  return useSWR(
    daoId ? ["vetoCouncilVotingPower", daoId] : null,
    () => fetchVetoCouncilVotingPower(daoId),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    },
  );
};
