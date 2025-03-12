import { DAO_VETO_COUNCIL_ADDRESSES } from "@/lib/dao-constants/dao-addresses";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";

interface VotingPowerResponse {
  data: {
    accountPowers: {
      items: Array<{
        votingPower: string;
      }>;
    };
  };
}

const fetchVetoCouncilVotingPower = async (
  daoId: DaoIdEnum,
): Promise<string | null> => {
  const accountId = DAO_VETO_COUNCIL_ADDRESSES[daoId];

  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GetVetoCounciVotingPower {
          accountPowers(where: {accountId: "${accountId}"}) {
            items {
              votingPower
            }
          }
        }
      `,
    }),
  });

  const data = (await response.json()) as VotingPowerResponse;
  return data.data.accountPowers.items[0]?.votingPower || null;
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
