import { useCompareDelegatedSupply } from "@anticapture/client/hooks";
import type {
  CompareDelegatedSupplyPathParamsDaoEnumKey,
  DaysWindow,
} from "@anticapture/client";

import type { DaoIdEnum } from "@/shared/types/daos";

export const useDelegatedSupply = (daoId: DaoIdEnum, days: string) => {
  const { data, isLoading, error } = useCompareDelegatedSupply(
    daoId.toLowerCase() as CompareDelegatedSupplyPathParamsDaoEnumKey,
    { days: days as DaysWindow },
    { query: { enabled: Boolean(daoId && days) } },
  );

  return {
    data: data ?? null,
    isLoading,
    error: error ?? null,
  };
};
