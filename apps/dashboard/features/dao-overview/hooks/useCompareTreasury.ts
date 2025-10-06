import {
  QueryInput_CompareTreasury_Days,
  useCompareTreasuryQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

interface CompareTreasury {
  changeRate: number;
  currentTreasury: string;
  oldTreasury: string;
}

interface UseCompareTreasuryResult {
  data: CompareTreasury | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCompareTreasury = (
  daoId: DaoIdEnum,
  days: TimeInterval,
): UseCompareTreasuryResult => {
  const { data, loading, error, refetch } = useCompareTreasuryQuery({
    variables: {
      days: QueryInput_CompareTreasury_Days[days],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return {
    data: data?.compareTreasury as CompareTreasury | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
