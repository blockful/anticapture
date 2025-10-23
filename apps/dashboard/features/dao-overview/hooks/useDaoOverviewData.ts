import { useMemo } from "react";
import {
  useDaoData,
  useActiveSupply,
  useDelegatedSupply,
  useAverageTurnout,
  useTokenData,
} from "@/shared/hooks";
import { useTreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import { useTokenHolders } from "@/features/holders-and-delegates";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { formatEther } from "viem";
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";

export const useDaoOverviewData = (daoId: DaoIdEnum) => {
  const { data: daoData } = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
  const delegatedSupply = useDelegatedSupply(daoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(daoId, TimeInterval.NINETY_DAYS);
  const tokenPrice = useTokenData(daoId);
  const treasuryNonDao = useTreasuryAssetNonDaoToken(
    daoId,
    TimeInterval.NINETY_DAYS,
  );

  const treasuryAll = useCompareTreasury(daoId, TimeInterval.NINETY_DAYS);
  const holders = useTokenHolders({
    daoId,
    limit: 20,
    orderDirection: "desc",
    days: TimeInterval.NINETY_DAYS,
  });

  const lastPrice = tokenPrice.data?.price ?? 0;
  const quorumValue = daoData?.quorum
    ? Number(daoData.quorum) / 10 ** 18
    : null;

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

  const averageTurnoutPercentAboveQuorum = useMemo(() => {
    if (!averageTurnout.data || !quorumValue) return 0;
    const turnoutTokens =
      Number(averageTurnout.data.currentAverageTurnout) / 10 ** 18;
    return (turnoutTokens / quorumValue - 1) * 100;
  }, [averageTurnout.data, quorumValue]);

  const topDelegatesToPass = useMemo(() => {
    if (!holders.data || !quorumValue) return null;
    const topHolders = holders.data
      .map((holder) => ({
        balance: Number(holder.balance) / 10 ** 18,
      }))
      .sort((a, b) => b.balance - a.balance);

    let topDelegatesBalance = 0;
    let topDelegatesCount = 0;
    for (const holder of topHolders) {
      topDelegatesBalance += holder.balance;
      topDelegatesCount++;
      if (topDelegatesBalance >= quorumValue) break;
    }

    if (topDelegatesBalance < quorumValue) return "20+";

    return topDelegatesCount;
  }, [holders.data, quorumValue]);

  const isLoading =
    activeSupply.isLoading ||
    delegatedSupply.isLoading ||
    averageTurnout.isLoading ||
    tokenPrice.isLoading ||
    treasuryNonDao.loading ||
    treasuryAll.loading ||
    holders.loading;

  return {
    daoData,
    activeSupply,
    delegatedSupply,
    averageTurnout,
    treasuryNonDao,
    holders,
    lastPrice,
    quorumValue,
    liquidTreasuryAllValue,
    liquidTreasuryNonDaoValue,
    liquidTreasuryAllPercent,
    averageTurnoutPercentAboveQuorum,
    topDelegatesToPass,
    isLoading,
  };
};
