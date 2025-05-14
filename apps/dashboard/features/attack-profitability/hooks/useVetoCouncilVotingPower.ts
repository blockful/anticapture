import { DAO_VETO_COUNCIL_ADDRESSES } from "@/lib/dao-config/dao-addresses";
import api from "@/lib/server/api";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";

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
  const accountId = DAO_VETO_COUNCIL_ADDRESSES[daoId];

  const response = await api.post<VotingPowerResponse>("", {
    query: `
      query GetVetoCouncilVotingPower {
        accountPowers(where: {accountId: "${accountId}"}) {
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
