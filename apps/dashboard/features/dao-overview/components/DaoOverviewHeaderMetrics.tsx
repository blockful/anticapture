import { formatNumberUserReadable } from "@/shared/utils";
import { DaoOverviewMetricCard } from "@/features/dao-overview/components/DaoOverviewMetricCard";

interface DaoOverviewHeaderMetricsProps {
  daoId: string;
  delegatedSupplyValue: string;
  activeSupplyValue: string;
  averageTurnoutValue: string;
  averageTurnoutPercentAboveQuorum: number;
  liquidTreasuryAllValue: number;
  liquidTreasuryAllPercent: string;
  liquidTreasuryNonDaoValue: number;
  topDelegatesToPass: number | string | null;
}

export const DaoOverviewHeaderMetrics = ({
  daoId,
  delegatedSupplyValue,
  activeSupplyValue,
  averageTurnoutValue,
  averageTurnoutPercentAboveQuorum,
  liquidTreasuryAllValue,
  liquidTreasuryAllPercent,
  liquidTreasuryNonDaoValue,
  topDelegatesToPass,
}: DaoOverviewHeaderMetricsProps) => (
  <div className="border-t-1 border-t-border-default md:bg-surface-default grid grid-cols-2 gap-4 border-dashed pt-4 md:grid-cols-4 md:gap-0.5 md:border-none md:pt-0">
    <DaoOverviewMetricCard
      title="Votable Supply"
      text={`${delegatedSupplyValue} ${daoId} delegated`}
      subText={`${activeSupplyValue} ${daoId} active in last 90d`}
    />

    <DaoOverviewMetricCard
      title="Treasury"
      text={`$${formatNumberUserReadable(liquidTreasuryAllValue)} (${liquidTreasuryAllPercent}% in ${daoId})`}
      subText={`$${formatNumberUserReadable(liquidTreasuryNonDaoValue)} not counting ${daoId}`}
    />

    <DaoOverviewMetricCard
      title="Average Turnout"
      text={`${averageTurnoutValue} ${daoId}`}
      subText={`${Math.abs(averageTurnoutPercentAboveQuorum).toFixed(2)}% ${averageTurnoutPercentAboveQuorum < 0 ? "below" : "above"} quorum`}
    />

    <DaoOverviewMetricCard
      title="Delegate to Pass"
      text={`Top ${topDelegatesToPass || "N/A"} delegates`}
      subText="To reach quorum"
    />
  </div>
);
