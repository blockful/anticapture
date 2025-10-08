import { formatNumberUserReadable } from "@/shared/utils";

interface DaoOverviewMetricsProps {
  daoId: string;
  delegatedSupplyValue: string;
  activeSupplyValue: string;
  averageTurnoutValue: string;
  averageTurnoutPercentAboveQuorum: number;
  liquidTreasuryAllValue: number;
  liquidTreasuryAllPercent: string;
  liquidTreasuryNonDaoValue: number;
  topDelegatesToPass: number | null;
}

const DaoOverviewMetricCard = ({
  title,
  text,
  subText,
}: {
  title: string;
  text: string;
  subText: string;
}) => (
  <div>
    <p className="text-secondary mb-2 font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </p>
    <p className="text-primary text-sm leading-5">{text}</p>
    <p className="text-secondary text-xs">{subText}</p>
  </div>
);

export const DaoOverviewMetrics = ({
  daoId,
  delegatedSupplyValue,
  activeSupplyValue,
  averageTurnoutValue,
  averageTurnoutPercentAboveQuorum,
  liquidTreasuryAllValue,
  liquidTreasuryAllPercent,
  liquidTreasuryNonDaoValue,
  topDelegatesToPass,
}: DaoOverviewMetricsProps) => (
  <div className="border-t-1 border-t-border-default md:bg-surface-default grid grid-cols-2 gap-4 border-dashed pt-4 md:flex md:grid-cols-4 md:justify-between md:border-none md:px-4 md:py-3">
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
      text={`Top ${topDelegatesToPass ?? "--"} delegates`}
      subText="To reach quorum"
    />
  </div>
);
