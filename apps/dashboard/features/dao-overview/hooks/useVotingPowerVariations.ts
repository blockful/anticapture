import { useVotingPowerVariationsQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import {
  VotingPowerVariations_200_Response,
  QueryInput_VotingPowerVariations_Days,
} from "@anticapture/graphql-client";

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
      days: QueryInput_VotingPowerVariations_Days[days],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return {
    data: data?.votingPowerVariations as VotingPowerVariations_200_Response | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
