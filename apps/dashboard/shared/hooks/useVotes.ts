import {
  DaysWindow,
  useCompareVotesQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export const useVotes = (daoId: DaoIdEnum, days: string) => {
  const daysKey = days as keyof typeof DaysWindow;

  const { data, loading, error } = useCompareVotesQuery({
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
    data: data?.compareVotes ?? null,
    isLoading: loading,
    error: error || null,
  };
};
