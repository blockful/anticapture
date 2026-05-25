import { useMemo } from "react";

import type {
  GetDaoTokenTreasuryPathParamsDaoEnumKey,
  GetLiquidTreasuryPathParamsDaoEnumKey,
  GetTotalTreasuryPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useGetDaoTokenTreasury,
  useGetLiquidTreasury,
  useGetTotalTreasury,
} from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";

export const useDaoTreasuryStats = ({
  daoId,
  tokenData,
}: {
  daoId: DaoIdEnum;
  tokenData: { data?: { price?: string | null } | null };
}) => {
  const daoKey = daoId.toLowerCase();

  const { data: liquidTreasuryData } = useGetLiquidTreasury(
    daoKey as GetLiquidTreasuryPathParamsDaoEnumKey,
    { days: TimeInterval.SEVEN_DAYS, orderDirection: "desc" },
  );
  const { data: tokenTreasuryData } = useGetDaoTokenTreasury(
    daoKey as GetDaoTokenTreasuryPathParamsDaoEnumKey,
    { days: TimeInterval.SEVEN_DAYS, orderDirection: "desc" },
  );
  const { data: allTreasuryData } = useGetTotalTreasury(
    daoKey as GetTotalTreasuryPathParamsDaoEnumKey,
    { days: TimeInterval.SEVEN_DAYS, orderDirection: "desc" },
  );

  return useMemo(() => {
    const lastPrice = Number(tokenData.data?.price) || 0;
    const liquidValue = liquidTreasuryData?.items[0]?.value ?? 0;
    const tokenValue = tokenTreasuryData?.items[0]?.value ?? 0;
    const totalValue = allTreasuryData?.items[0]?.value ?? 0;

    const liquidTreasuryAllPercent = totalValue
      ? Math.round((tokenValue / totalValue) * 100).toString()
      : "0";

    return {
      lastPrice,
      liquidTreasuryNonDaoValue: liquidValue,
      liquidTreasuryAllValue: totalValue,
      liquidTreasuryAllPercent,
    };
  }, [liquidTreasuryData, tokenTreasuryData, allTreasuryData, tokenData]);
};
