import { DaoOverviewMetricCard } from "@/features/dao-overview/components/DaoOverviewMetricCard";
import { useDaoOverviewData } from "@/features/dao-overview/hooks/useDaoOverviewData";
import { DaoIdEnum } from "@/shared/types/daos";
import { useQuorumGap } from "@/shared/hooks/useQuorumGap";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { DaoOverviewHeader } from "@/features/dao-overview/components/DaoOverviewHeader";
import { formatNumberUserReadable } from "@/shared/utils";

interface DaoOverviewHeaderMetricsProps {
  daoId: string;
  daoConfig: DaoConfiguration;
}

export const DaoOverviewHeaderMetrics = ({
  daoId,
  daoConfig,
}: DaoOverviewHeaderMetricsProps) => {
  const {
    treasuryStats,
    delegatedSupply,
    activeSupply,
    averageTurnout,
    topDelegatesToPass,
    isLoading,
  } = useDaoOverviewData({ daoId: daoId as DaoIdEnum, daoConfig });

  const { data: quorumGap } = useQuorumGap(daoId as DaoIdEnum);

  const {
    liquidTreasuryAllValue,
    liquidTreasuryAllPercent,
    liquidTreasuryNonDaoValue,
    lastPrice,
  } = treasuryStats;

  const delegatedSupplyValue = formatNumberUserReadable(delegatedSupply);
  const activeSupplyValue = formatNumberUserReadable(activeSupply);
  const averageTurnoutValue = formatNumberUserReadable(averageTurnout);

  const liquidTreasuryAllValueFormatted = formatNumberUserReadable(
    liquidTreasuryAllValue,
  );
  const liquidTreasuryNonDaoValueFormatted = formatNumberUserReadable(
    liquidTreasuryNonDaoValue,
  );

  return (
    <div className="flex flex-1 flex-col">
      <DaoOverviewHeader
        daoId={daoId}
        daoConfig={daoConfig}
        daoOverview={daoConfig.daoOverview}
        lastPrice={lastPrice}
        isLoading={isLoading}
      />
      <div className="border-t-border-default md:bg-surface-default grid grid-cols-2 gap-4 border-t border-dashed pt-4 md:grid-cols-4 md:gap-0.5 md:border-none md:pt-0">
        <DaoOverviewMetricCard
          title="Votable Supply"
          text={`${delegatedSupplyValue} ${daoId} delegated`}
          subText={`${activeSupplyValue} ${daoId} active in last 90d`}
          isLoading={isLoading}
        />

        <DaoOverviewMetricCard
          title="Treasury"
          text={`$${liquidTreasuryAllValueFormatted} (${liquidTreasuryAllPercent}% in ${daoId})`}
          subText={`$${liquidTreasuryNonDaoValueFormatted} not counting ${daoId}`}
          isLoading={isLoading}
        />

        <DaoOverviewMetricCard
          title="Average Turnout"
          text={`${averageTurnoutValue} ${daoId}`}
          isLoading={isLoading}
          subText={
            quorumGap !== null && quorumGap !== undefined && !isNaN(quorumGap)
              ? `${quorumGap !== 0 ? Math.abs(quorumGap).toFixed(2) + "%" : ""} ${quorumGap < 0 ? "below" : quorumGap == 0 ? "equal to" : "above"} quorum`
              : `No recent proposals`
          }
        />

        <DaoOverviewMetricCard
          title="Delegate to Pass"
          text={`Top ${topDelegatesToPass || "N/A"} delegates`}
          subText="To reach quorum"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
