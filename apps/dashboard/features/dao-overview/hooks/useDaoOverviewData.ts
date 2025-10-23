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
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { useDaoQuorumStats } from "@/features/dao-overview/hooks/useDaoQuorumStats";

export const useDaoOverviewData = (daoId: DaoIdEnum) => {
  const daoData = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
  const delegatedSupply = useDelegatedSupply(daoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(daoId, TimeInterval.NINETY_DAYS);
  const treasuryNonDao = useTreasuryAssetNonDaoToken(
    daoId,
    TimeInterval.NINETY_DAYS,
  );
  const treasuryAll = useCompareTreasury(daoId, TimeInterval.NINETY_DAYS);
  const tokenData = useTokenData(daoId);

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
    tokenData,
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
    tokenData.isLoading ||
    treasuryNonDao.loading ||
    treasuryAll.loading ||
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
