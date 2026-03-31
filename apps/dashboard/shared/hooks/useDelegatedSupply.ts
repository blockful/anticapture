import {
  DaysWindow,
  useCompareDelegatedSupplyQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export const useDelegatedSupply = (daoId: DaoIdEnum, days: string) => {
  const daysKey = days as keyof typeof DaysWindow;

  const { data, loading, error } = useCompareDelegatedSupplyQuery({
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
    data: data?.compareDelegatedSupply ?? null,
    isLoading: loading,
    error: error || null,
  };
};
