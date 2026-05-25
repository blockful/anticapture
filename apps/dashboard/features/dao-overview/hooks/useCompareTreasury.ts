import type { CompareTreasuryPathParamsDaoEnumKey } from "@anticapture/client";
import { useCompareTreasury as useCompareTreasuryHook } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums";

interface CompareTreasury {
  changeRate: number;
  currentValue: string;
  previousValue: string;
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
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useCompareTreasuryHook(
    daoId.toLowerCase() as CompareTreasuryPathParamsDaoEnumKey,
    { days },
  );

  return {
    data: data as CompareTreasury | null,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: () => refetch(),
  };
};
