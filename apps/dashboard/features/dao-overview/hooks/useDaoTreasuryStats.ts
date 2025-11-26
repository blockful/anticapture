import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import { TokenDataResponse } from "@/shared/hooks";
import { CompareTreasury_200_Response } from "@anticapture/graphql-client";
import { useMemo } from "react";
import { formatUnits } from "viem";

export const useDaoTreasuryStats = ({
  treasuryAll,
  treasuryNonDao,
  tokenData,
  decimals,
}: {
  treasuryAll: { data?: CompareTreasury_200_Response | null };
  treasuryNonDao: { data?: TreasuryAssetNonDaoToken[] | null };
  tokenData: { data?: TokenDataResponse | null };
  decimals: number;
}) => {
  return useMemo(() => {
    const lastPrice = Number(tokenData.data?.price) || 0;
    const liquidTreasuryUSD = Number(
      treasuryNonDao.data?.[0]?.totalAssets || 0,
    );
    const daoTreasuryTokens = Number(treasuryAll.data?.currentTreasury || 0);
    const govTreasuryUSD =
      Number(formatUnits(BigInt(daoTreasuryTokens), decimals)) * lastPrice;

    const liquidTreasuryAllPercent = govTreasuryUSD
      ? Math.round(
          (govTreasuryUSD / (govTreasuryUSD + liquidTreasuryUSD)) * 100,
        ).toString()
      : "0";

    return {
      lastPrice,
      liquidTreasuryNonDaoValue: liquidTreasuryUSD,
      liquidTreasuryAllValue: govTreasuryUSD,
      liquidTreasuryAllPercent,
    };
  }, [tokenData, treasuryAll.data, treasuryNonDao.data, decimals]);
};
