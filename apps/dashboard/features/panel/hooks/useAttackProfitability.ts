import { useMemo } from "react";

import { useTreasury } from "@/features/attack-profitability/hooks";
import { useCostOfAttack } from "@/features/panel/hooks/useCostOfAttack";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";

export const useAttackProfitability = (daoId: DaoIdEnum) => {
  const { data: liquidTreasuryData, loading: liquidTreasuryLoading } =
    useTreasury(daoId, "liquid", TimeInterval.SEVEN_DAYS);

  const { costOfAttack, isLoading: costOfAttackLoading } =
    useCostOfAttack(daoId);

  const profitability = useMemo(() => {
    if (
      !liquidTreasuryData ||
      !liquidTreasuryData.length ||
      !costOfAttack ||
      costOfAttack === 0
    ) {
      return null;
    }
    const liquidTreasuryValue = Number(liquidTreasuryData[0]?.value || 0);
    const value = liquidTreasuryValue - costOfAttack;
    const percent = (value / costOfAttack) * 100;

    return { value, percent };
  }, [liquidTreasuryData, costOfAttack]);

  return {
    profitability,
    isLoading: liquidTreasuryLoading || costOfAttackLoading,
  };
};
