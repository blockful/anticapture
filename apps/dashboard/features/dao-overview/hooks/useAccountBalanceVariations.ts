import { useMemo } from "react";

import { useAccountBalanceVariationsQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { AccountBalanceVariations_200_Response } from "@anticapture/graphql-client";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";

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
  const fromDate = useMemo(() => {
    return (Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days]).toString();
  }, [days]);

  const { data, loading, error, refetch } = useAccountBalanceVariationsQuery({
    variables: {
      fromDate,
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
