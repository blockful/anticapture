import {
  QueryInput_HistoricalBalances_DaoId,
  QueryInput_HistoricalBalances_Days,
  useGetHistoricalBalancesQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

interface HistoricalBalance {
  address: string;
  balance: string;
  blockNumber: string;
  tokenAddress: string;
}

interface UseHistoricalBalancesResult {
  data: HistoricalBalance[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useHistoricalBalances = (
  daoId: DaoIdEnum,
  addresses: string[],
  days: TimeInterval,
): UseHistoricalBalancesResult => {
  const { data, loading, error, refetch } = useGetHistoricalBalancesQuery({
    variables: {
      addresses,
      days: QueryInput_HistoricalBalances_Days[days],
      daoId: daoId as unknown as QueryInput_HistoricalBalances_DaoId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !addresses.length,
  });

  return {
    data: data?.historicalBalances as HistoricalBalance[] | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
