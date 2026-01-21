import { useGetHistoricalBalancesQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";

interface HistoricalBalance {
  accountId: string;
  previousBalance: string;
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
      fromDate: (
        Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days]
      ).toString(),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !addresses.length,
  });

  return {
    data: data?.accountBalanceVariations as HistoricalBalance[] | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
