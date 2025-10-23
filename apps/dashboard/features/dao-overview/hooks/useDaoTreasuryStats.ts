import {
  DaoTokenHistoricalDataResponse,
  TreasuryAssetNonDaoToken,
} from "@/features/attack-profitability/hooks";
import { CompareTreasury_200_Response } from "@anticapture/graphql-client";
import { useMemo } from "react";
import { formatEther } from "viem";

export const useDaoTreasuryStats = ({
  treasuryAll,
  treasuryNonDao,
  tokenPrice,
}: {
  treasuryAll: { data?: CompareTreasury_200_Response | null };
  treasuryNonDao: { data?: TreasuryAssetNonDaoToken[] | null };
  tokenPrice: { data?: DaoTokenHistoricalDataResponse | { prices: never[] } };
}) => {
  return useMemo(() => {
    const lastPrice = tokenPrice.data?.prices?.at(-1)?.[1] ?? 0;
    const liquidTreasuryNonDaoValue = Number(
      treasuryNonDao.data?.[0]?.totalAssets || 0,
    );
    const daoTreasuryTokens = Number(treasuryAll.data?.currentTreasury || 0);
    const liquidTreasuryAllValue =
      Number(formatEther(BigInt(daoTreasuryTokens))) * lastPrice;

    const liquidTreasuryAllPercent = liquidTreasuryAllValue
      ? Math.round(
          ((liquidTreasuryAllValue - liquidTreasuryNonDaoValue) /
            liquidTreasuryAllValue) *
            100,
        ).toString()
      : "0";

    return {
      lastPrice,
      liquidTreasuryNonDaoValue,
      liquidTreasuryAllValue,
      liquidTreasuryAllPercent,
    };
  }, [tokenPrice.data, treasuryAll.data, treasuryNonDao.data]);
};
