import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";
import { DAO_ADDRESSES } from "@/lib/dao-constants/dao-addresses";
import daoConfigByDaoId from "@/lib/dao-constants";
import { DaoConstantsFullySupported } from "@/lib/dao-constants/types";
interface AccountBalance {
  accountId: string;
  balance: string;
}

interface TopHolderResponse {
  data: {
    accountBalances: {
      items: AccountBalance[];
    };
  };
}

const fetchTopTokenHolder = async (
  daoId: DaoIdEnum,
): Promise<AccountBalance | null> => {
  const daoAddresses = Object.values(DAO_ADDRESSES[daoId]);
  const tokenAddress = (
    daoConfigByDaoId[daoId] as DaoConstantsFullySupported
  ).contracts.token;

  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query DaoMetricsDayBuckets {
          accountBalances(
            where: {
              tokenId: "${tokenAddress}",
              accountId_not_in: ${JSON.stringify(daoAddresses)}
            }
            orderBy: "balance",
            orderDirection: "DESC",
            limit: 1
          ) {
            items {
              accountId
              balance
            }
          }
        }
      `,
    }),
  });

  const data = (await response.json()) as TopHolderResponse;
  return data.data.accountBalances.items[0] || null;
};

/**
 * Hook to fetch the top token holder excluding DAO addresses
 * @param daoId The DAO ID to fetch data for
 * @param options Additional SWR options
 */
export const useTopTokenHolderNonDao = (
  daoId: DaoIdEnum,
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  },
) => {
  const fetcher = () => fetchTopTokenHolder(daoId);

  return useSWR(daoId ? [`topTokenHolder`, daoId] : null, fetcher, {
    refreshInterval: options?.refreshInterval || 0,
    revalidateOnFocus: options?.revalidateOnFocus ?? false,
    revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
    dedupingInterval: 10000,
  });
};
