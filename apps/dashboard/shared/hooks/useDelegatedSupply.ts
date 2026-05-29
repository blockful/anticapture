import { useCompareDelegatedSupply } from "@anticapture/client/hooks";
import type {
  CompareDelegatedSupplyPathParamsDaoEnumKey,
  DaysWindow,
} from "@anticapture/client";

import type { DaoIdEnum } from "@/shared/types/daos";

export const useDelegatedSupply = (daoId: DaoIdEnum, days: DaysWindow) => {
  const { data, isLoading, error } = useCompareDelegatedSupply(
    daoId.toLowerCase() as CompareDelegatedSupplyPathParamsDaoEnumKey,
    { days },
  );

  return {
    data,
    isLoading,
    error,
  };
};
