import { useVotingPowerVariationsQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { VotingPowerVariations_200_Response } from "@anticapture/graphql-client";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";

interface UseVotingPowerVariationsResult {
  data: VotingPowerVariations_200_Response | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useVotingPowerVariations = (
  daoId: DaoIdEnum,
  days: TimeInterval,
): UseVotingPowerVariationsResult => {
  const { data, loading, error, refetch } = useVotingPowerVariationsQuery({
    variables: {
      fromDate: (
        Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days]
      ).toString(),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    data: data?.votingPowerVariations as VotingPowerVariations_200_Response | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
