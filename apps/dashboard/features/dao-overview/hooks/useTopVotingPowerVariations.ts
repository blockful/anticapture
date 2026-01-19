import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { useTopVotingPowerVariationsQuery } from "@anticapture/graphql-client/hooks";
import { useMemo } from "react";

export const useTopVotingPowerVariations = (
  daoId: DaoIdEnum,
  days: TimeInterval,
) => {
  const fromDate = useMemo(() => {
    return (Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days]).toString();
  }, [days]);

  const { data, loading, error, refetch } = useTopVotingPowerVariationsQuery({
    variables: {
      fromDate,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return {
    data: data?.votingPowerVariations?.items ?? [],
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
