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
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { useDaoQuorumStats } from "@/features/dao-overview/hooks/useDaoQuorumStats";

export const useDaoOverviewData = (daoId: DaoIdEnum) => {
  const daoData = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
  const delegatedSupply = useDelegatedSupply(daoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(daoId, TimeInterval.NINETY_DAYS);
  const tokenPrice = useDaoTokenHistoricalData({
    daoId,
    days: TimeInterval.SEVEN_DAYS,
  });
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

  const { quorumValue, averageTurnoutPercentAboveQuorum } = useDaoQuorumStats({
    daoData: daoData.data,
    averageTurnout,
  });

  const treasuryStats = useDaoTreasuryStats({
    treasuryAll,
    treasuryNonDao,
    tokenPrice,
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    holders,
    quorumValue,
  });

  const isLoading =
    daoData.loading ||
    activeSupply.isLoading ||
    delegatedSupply.isLoading ||
    averageTurnout.isLoading ||
    treasuryNonDao.loading ||
    treasuryAll.loading ||
    tokenPrice.loading ||
    holders.loading;

  return {
    daoData: daoData.data,
    activeSupply,
    delegatedSupply,
    averageTurnout,
    treasuryStats,
    quorumValue,
    averageTurnoutPercentAboveQuorum,
    topDelegatesToPass,
    isLoading,
  };
};
