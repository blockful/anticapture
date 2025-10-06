import { useMemo } from "react";
import {
  useDaoData,
  useActiveSupply,
  useDelegatedSupply,
  useAverageTurnout,
} from "@/shared/hooks";
import {
  useDaoTokenHistoricalData,
  useTreasuryAssetNonDaoToken,
} from "@/features/attack-profitability/hooks";
import { useTokenHolders } from "@/features/holders-and-delegates";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { formatEther } from "viem";

export const useDaoOverviewData = (daoId: DaoIdEnum) => {
  const { data: daoData } = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
  const delegatedSupply = useDelegatedSupply(daoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(daoId, TimeInterval.NINETY_DAYS);
  const tokenPrice = useDaoTokenHistoricalData({
    daoId,
    days: TimeInterval.SEVEN_DAYS,
  });
  const treasury = useTreasuryAssetNonDaoToken(daoId, TimeInterval.NINETY_DAYS);
  const holders = useTokenHolders({
    daoId,
    limit: 10,
    orderDirection: "desc",
  });

  const lastPrice = tokenPrice.data?.prices?.at(-1)?.[1] ?? 0;
  const quorumValue = daoData?.quorum
    ? Number(daoData.quorum) / 10 ** 18
    : null;

  const liquidTreasuryNonDaoValue = Number(
    treasury.data?.[0]?.totalAssets || 0,
  );

  const daoTreasuryTokens = Number(activeSupply.data?.activeSupply || 0);
  const daoTreasuryValue =
    Number(formatEther(BigInt(daoTreasuryTokens))) * lastPrice;

  const liquidTreasuryAllValue = daoTreasuryValue + liquidTreasuryNonDaoValue;

  const liquidTreasuryAllPercent = liquidTreasuryAllValue
    ? (
        ((liquidTreasuryAllValue - liquidTreasuryNonDaoValue) /
          liquidTreasuryAllValue) *
        100
      ).toFixed(2)
    : "0";

  const averageTurnoutPercentAboveQuorum = useMemo(() => {
    if (!averageTurnout.data || !quorumValue) return null;
    const turnoutTokens =
      Number(averageTurnout.data.currentAverageTurnout) / 10 ** 18;
    return ((turnoutTokens / quorumValue - 1) * 100).toFixed(2);
  }, [averageTurnout.data, quorumValue]);

  const topDelegatesToPass = useMemo(() => {
    if (!holders.data || !quorumValue) return null;
    const topHolders = holders.data
      .map((h) => ({
        balance: Number(h.balance) / 10 ** 18,
      }))
      .sort((a, b) => b.balance - a.balance);

    let acc = 0;
    let count = 0;
    for (const holder of topHolders) {
      acc += holder.balance;
      count++;
      if (acc >= quorumValue) break;
    }
    return count;
  }, [holders.data, quorumValue]);

  const isLoading = [
    activeSupply.isLoading,
    delegatedSupply.isLoading,
    averageTurnout.isLoading,
    treasury.loading,
    tokenPrice.loading,
    holders.loading,
  ].some(Boolean);

  return {
    daoData,
    activeSupply,
    delegatedSupply,
    averageTurnout,
    treasury,
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
