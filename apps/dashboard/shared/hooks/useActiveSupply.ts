import {
  DaysWindow,
  useCompareActiveSupplyQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export const useActiveSupply = (daoId: DaoIdEnum, days: string) => {
  const daysKey = days as keyof typeof DaysWindow;

  const { data, loading, error } = useCompareActiveSupplyQuery({
    variables: {
      days: DaysWindow[daysKey],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !daoId || !days,
    fetchPolicy: "no-cache",
  });

  return {
    data: data?.compareActiveSupply ?? null,
    isLoading: loading,
    error: error || null,
  };
};
