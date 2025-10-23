import { useAccountBalanceVariationsQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import {
  AccountBalanceVariations_200_Response,
  QueryInput_AccountBalanceVariations_Days,
} from "@anticapture/graphql-client";

interface UseAccountBalanceVariationsResult {
  data: AccountBalanceVariations_200_Response | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useAccountBalanceVariations = (
  daoId: DaoIdEnum,
  days: TimeInterval,
): UseAccountBalanceVariationsResult => {
  const { data, loading, error, refetch } = useAccountBalanceVariationsQuery({
    variables: {
      days: QueryInput_AccountBalanceVariations_Days[days],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    data: data?.accountBalanceVariations as AccountBalanceVariations_200_Response | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
