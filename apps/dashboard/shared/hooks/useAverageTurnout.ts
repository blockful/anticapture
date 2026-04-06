import {
  DaysWindow,
  useCompareAverageTurnoutQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export const useAverageTurnout = (daoId: DaoIdEnum, days: string) => {
  const daysKey = days as keyof typeof DaysWindow;

  const { data, loading, error } = useCompareAverageTurnoutQuery({
    variables: {
      days: DaysWindow[daysKey],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
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
