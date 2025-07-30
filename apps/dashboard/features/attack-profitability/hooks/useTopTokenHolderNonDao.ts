import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetDaoAddressesAccountBalancesQuery,
  useGetDaoAddressesAccountBalancesQuery,
} from "@anticapture/graphql-client/hooks";
import { ApolloError, ApolloQueryResult } from "@apollo/client";
import { Address } from "viem";

interface TopTokenHolderNonDaoResponse {
  data:
    | GetDaoAddressesAccountBalancesQuery["accountBalances"]["items"][0]
    | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<
    ApolloQueryResult<GetDaoAddressesAccountBalancesQuery>
  >;
}
/**
 * Hook to fetch the top token holder excluding DAO addresses this is used to calculate the attack profitability
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
): TopTokenHolderNonDaoResponse => {
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
    data: data?.accountBalances.items[0] || undefined,
    loading,
    error: error || undefined,
    refetch,
  };
};
