import {
  DaysWindow,
  useCompareAverageTurnoutQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export const useAverageTurnout = (daoId: DaoIdEnum, days: string) => {
  const daysKey = days as keyof typeof DaysWindow;

  const { data, loading, error } = useCompareAverageTurnoutQuery({
    variables: {
      days: DaysWindow[daysKey],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !daoId || !days,
  });

  return {
    data: data?.compareAverageTurnout ?? null,
    isLoading: loading,
    error: error || null,
  };
};
