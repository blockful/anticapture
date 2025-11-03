import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import { TokenDataResponse } from "@/shared/hooks";
import { CompareTreasury_200_Response } from "@anticapture/graphql-client";
import { useMemo } from "react";
import { formatEther } from "viem";

export const useDaoTreasuryStats = ({
  treasuryAll,
  treasuryNonDao,
  tokenData,
}: {
  treasuryAll: { data?: CompareTreasury_200_Response | null };
  treasuryNonDao: { data?: TreasuryAssetNonDaoToken[] | null };
  tokenData: { data?: TokenDataResponse | null };
}) => {
  return useMemo(() => {
    const lastPrice = Number(tokenData.data?.price) || 0;
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
  }, [tokenData, treasuryAll.data, treasuryNonDao.data]);
};
