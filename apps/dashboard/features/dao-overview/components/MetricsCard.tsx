import { DaoOverviewMetricCard } from "@/features/dao-overview/components/DaoOverviewMetricCard";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { formatBlocksToUserReadable } from "@/shared/utils";

interface MetricsCardProps {
  daoId: string;
  daoConfig: DaoConfiguration;
  proposalThresholdValue: string;
  proposalThresholdPercentage: string | null;
  quorumValueFormatted: string;
  quorumPercentage: string | null;
  votingPeriod: number;
  votingDelay: number;
  timelockDelay: number;
}

export const MetricsCard = ({
  daoId,
  daoConfig,
  proposalThresholdValue,
  proposalThresholdPercentage,
  quorumValueFormatted,
  quorumPercentage,
  votingPeriod,
  votingDelay,
  timelockDelay,
}: MetricsCardProps) => {
  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `${parseFloat(proposalThresholdPercentage).toFixed(1)}%`
    : "N/A";

  const quorumLogic = daoConfig.daoOverview.rules?.logic;

  const executionRules = daoConfig.daoOverview.rules?.timelock
    ? "Timelock"
    : daoConfig.daoOverview.rules?.cancelFunction
      ? "Cancel Function"
      : "N/A";

  const daoConfigBlockTime = daoConfig.daoOverview.chain.blockTime
    ? daoConfig.daoOverview.chain.blockTime / 1000
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:justify-between md:gap-2 md:border-none">
      <DaoOverviewMetricCard
        title="Proposal Threshold"
        text={`${proposalThresholdValue} ${daoId || "Unknown ID"} (${proposalThresholdPercentageFormatted} Total Supply)`}
        subText={"Minimum voting power to submit"}
        className="border-b-1 border-border-contrast border-dashed pb-4 md:border-none md:p-3"
      />

      <DaoOverviewMetricCard
        title="Voting Period"
        text={`${formatBlocksToUserReadable(votingPeriod, daoConfigBlockTime)} to vote`}
        subText={
          <span>
            Starts after{" "}
            <span className="bg-surface-opacity rounded-full px-1.5 py-0.5">
              {formatBlocksToUserReadable(votingDelay, daoConfigBlockTime) ||
                "N/A"}
            </span>{" "}
            delay
          </span>
        }
        className="border-b-1 border-border-contrast border-dashed pb-4 md:border-none md:p-3"
        textClassName="mb-1"
      />

      <DaoOverviewMetricCard
        title="Quorum"
        text={`${quorumValueFormatted} ${daoId || "Unknown ID"} ${quorumPercentage}`}
        subText={
          <span>
            Only{" "}
            <span className="bg-surface-opacity rounded-full px-1.5 py-0.5">
              {quorumLogic || "N/A"}
            </span>{" "}
            votes are counted
          </span>
        }
        className="border-b-1 border-border-contrast border-dashed pb-4 md:border-none md:p-3"
        textClassName="mb-1"
      />

      <DaoOverviewMetricCard
        title="Execution Rules"
        text={`Executed by ${executionRules}`}
        subText={
          executionRules === "Timelock" ? (
            <span>
              After{" "}
              <span className="bg-surface-opacity rounded-full px-1.5 py-0.5">
                {formatBlocksToUserReadable(
                  timelockDelay,
                  daoConfigBlockTime,
                ) || "N/A"}
              </span>{" "}
              of delay
            </span>
          ) : (
            "No delay required"
          )
        }
        textClassName="mb-1"
      />
    </div>
  );
};
