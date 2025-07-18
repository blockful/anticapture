/* eslint-disable react-hooks/rules-of-hooks */
import { DaoIdEnum } from "@/shared/types/daos";
import { useGetDaoAddressesAccountBalancesQuery } from "@anticapture/graphql-client/hooks";
import { Address } from "viem";

/**
 * Hook to fetch the top token holder excluding DAO addresses
 * @param daoId The DAO ID to fetch data for
 * @param options Additional options
 */
export const useTopTokenHolderNonDao = (
  daoId: DaoIdEnum,
  tokenAddress: Address,
  daoAddresses: string[],
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  },
) => {
  const { data, loading, error, refetch } =
    useGetDaoAddressesAccountBalancesQuery({
      context: {
        headers: {
          "anticapture-dao-id": daoId,
        },
      },
      variables: {
        tokenAddresses: tokenAddress,
        daoAddresses: daoAddresses as string[],
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
      pollInterval: options?.refreshInterval || 0,
      errorPolicy: "all",
    });

  return {
    data: data?.accountBalances.items[0] || null,
    loading,
    error: error || undefined,
    refetch,
  };
};
