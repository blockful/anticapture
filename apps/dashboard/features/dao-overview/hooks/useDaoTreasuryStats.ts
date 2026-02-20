import { useMemo } from "react";
import { useTreasury } from "@/features/attack-profitability/hooks/useTreasury";
import { TokenDataResponse } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";

export const useDaoTreasuryStats = ({
  daoId,
  tokenData,
}: {
  daoId: DaoIdEnum;
  tokenData: { data?: TokenDataResponse | null };
}) => {
  // Use 7 days (minimum supported) with desc order to get most recent first
  const { data: liquidTreasury } = useTreasury(
    daoId,
    "liquid",
    TimeInterval.SEVEN_DAYS,
    "desc",
  );
  const { data: tokenTreasury } = useTreasury(
    daoId,
    "dao-token",
    TimeInterval.SEVEN_DAYS,
    "desc",
  );
  const { data: allTreasury } = useTreasury(
    daoId,
    "total",
    TimeInterval.SEVEN_DAYS,
    "desc",
  );

  return useMemo(() => {
    const lastPrice = Number(tokenData.data?.price) || 0;
    const liquidValue = liquidTreasury[0]?.value ?? 0;
    const tokenValue = tokenTreasury[0]?.value ?? 0;
    const totalValue = allTreasury[0]?.value ?? 0;

    const liquidTreasuryAllPercent = totalValue
      ? Math.round((tokenValue / totalValue) * 100).toString()
      : "0";

    return {
      lastPrice,
      liquidTreasuryNonDaoValue: liquidValue,
      liquidTreasuryAllValue: totalValue,
      liquidTreasuryAllPercent,
    };
  }, [liquidTreasury, tokenTreasury, allTreasury, tokenData]);
};
