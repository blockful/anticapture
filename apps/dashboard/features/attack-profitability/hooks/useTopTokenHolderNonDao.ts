import type { GetDaoAddressesAccountBalancesQuery } from "@anticapture/graphql-client/hooks";
import { useGetDaoAddressesAccountBalancesQuery } from "@anticapture/graphql-client/hooks";
import type { ApolloError, ApolloQueryResult } from "@apollo/client";

import type { DaoIdEnum } from "@/shared/types/daos";

interface TopTokenHolderNonDaoResponse {
  data:
    | NonNullable<
        NonNullable<
          GetDaoAddressesAccountBalancesQuery["accountBalances"]
        >["items"][number]
      >
    | null
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
        excludeDaoAddresses: true,
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
      pollInterval: options?.refreshInterval || 0,
      errorPolicy: "all",
    });

  return {
    data: data?.accountBalances?.items[0] || undefined,
    loading,
    error: error || undefined,
    refetch,
  };
};
