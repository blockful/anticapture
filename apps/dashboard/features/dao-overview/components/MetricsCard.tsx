import { DaoOverviewMetricCard } from "@/features/dao-overview/components/DaoOverviewMetricCard";

interface MetricsCardProps {
  daoId: string;
  proposalThresholdValue: string;
  proposalThresholdPercentage: string | null;
}

export const MetricsCard = ({
  daoId,
  proposalThresholdValue,
  proposalThresholdPercentage,
}: MetricsCardProps) => {
  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `${parseFloat(proposalThresholdPercentage).toFixed(1)}%`
    : "N/A";
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:justify-between md:border-none">
      <DaoOverviewMetricCard
        title="Proposal Threshold"
        text={`${proposalThresholdValue} ${daoId || "Unknown ID"} (${proposalThresholdPercentageFormatted} Total Supply)`}
        subText={"Minimum voting power to submit"}
      />

      <DaoOverviewMetricCard title="Voting Period" text={""} subText={""} />

      <DaoOverviewMetricCard title="Quorum" text={""} subText={""} />

      <DaoOverviewMetricCard title="Execution Rules" text={""} subText={""} />
    </div>
  );
};
