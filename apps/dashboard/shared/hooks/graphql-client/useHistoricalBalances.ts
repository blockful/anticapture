import { useMemo } from "react";

import { useBalanceVariationsQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";

export const useHistoricalBalances = (
  daoId: DaoIdEnum,
  addresses: string[],
  days: TimeInterval,
) => {
  const fromDate = useMemo(() => {
    return (Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days]).toString();
  }, [days]);

  const { data, loading, error, refetch } = useBalanceVariationsQuery({
    variables: {
      addresses,
      fromDate,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !addresses.length,
  });

  console.log({ data });

  return {
    data: data?.accountBalanceVariations?.items,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
