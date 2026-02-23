import { ReactNode, useMemo } from "react";

import { DaoOverviewMetricCard } from "@/features/dao-overview/components/DaoOverviewMetricCard";
import { useDaoOverviewData } from "@/features/dao-overview/hooks/useDaoOverviewData";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  formatBlocksToUserReadable,
  formatNumberUserReadable,
  formatSecondsToReadable,
} from "@/shared/utils";

interface MetricsCardProps {
  daoId: string;
  daoConfig: DaoConfiguration;
}

const COMMON_CARD_CLASSES =
  "border-border-contrast border-b border-dashed pb-4 lg:border-none lg:p-3";
const TEXT_CLASSES = "mb-1";
const BADGE_CLASSES = "bg-surface-opacity rounded-full px-1.5 py-0.5";

const Badge = ({ children }: { children: ReactNode }) => (
  <span className={BADGE_CLASSES}>{children}</span>
);

const formatProposalThresholdPercentage = (
  percentage: string | null | undefined,
): string => {
  if (!percentage) return "N/A";
  return `${parseFloat(percentage).toFixed(1)}%`;
};

const getExecutionRules = (daoConfig: DaoConfiguration): string => {
  const { timelock, cancelFunction } = daoConfig.daoOverview.rules || {};

  if (timelock) return "Timelock";
  if (cancelFunction) return "Cancel Function";
  return "N/A";
};

const getBlockTime = (daoConfig: DaoConfiguration): number => {
  return daoConfig.daoOverview.chain.blockTime
    ? daoConfig.daoOverview.chain.blockTime / 1000
    : 0;
};

const QuorumMetric = ({
  daoId,
  quorumValueFormatted,
  quorumLogic,
  isLoading,
}: {
  daoId: string;
  quorumValueFormatted: number;
  quorumLogic: string | undefined;
  isLoading: boolean;
}) => {
  // if (daoId === DaoIdEnum.OPTIMISM) {
  //   return (
  //     <DaoOverviewMetricCard
  //       title="Quorum"
  //       text="Dynamic quorum"
  //       subText="Calculated per proposal"
  //       className={COMMON_CARD_CLASSES}
  //       textClassName={TEXT_CLASSES}
  //       isLoading={isLoading}
  //     />
  //   );
  // }

  return (
    <DaoOverviewMetricCard
      title="Quorum"
      text={`${formatNumberUserReadable(quorumValueFormatted)} ${daoId}`}
      subText={
        <span>
          Only <Badge>{quorumLogic || "N/A"}</Badge> votes are counted
        </span>
      }
      className={COMMON_CARD_CLASSES}
      textClassName={TEXT_CLASSES}
      isLoading={isLoading}
    />
  );
};

const ExecutionRulesMetric = ({
  executionRules,
  timelockDelay,
  isLoading,
}: {
  executionRules: string;
  timelockDelay: number;
  isLoading: boolean;
}) => {
  // if (daoId === DaoIdEnum.OPTIMISM) {
  //   return (
  //     <DaoOverviewMetricCard
  //       title="Execution Rules"
  //       text="Executed by multisig"
  //       textClassName={TEXT_CLASSES}
  //       isLoading={isLoading}
  //     />
  //   );
  // }

  const subText =
    executionRules === "Timelock" ? (
      <span>
        After{" "}
        <Badge>{formatSecondsToReadable(timelockDelay, true) || "N/A"}</Badge>{" "}
        of delay
      </span>
    ) : (
      "No delay required"
    );

  return (
    <DaoOverviewMetricCard
      title="Execution Rules"
      text={`Executed by ${executionRules}`}
      subText={subText}
      textClassName={TEXT_CLASSES}
      isLoading={isLoading}
    />
  );
};

const ProposalThresholdMetric = ({
  daoId,
  proposalThresholdValue,
  proposalThresholdPercentageFormatted,
  isLoading,
}: {
  daoId: string;
  proposalThresholdValue: string;
  proposalThresholdPercentageFormatted: string;
  isLoading: boolean;
}) => {
  const text =
    proposalThresholdValue !== "0"
      ? `${proposalThresholdValue} ${daoId || "Unknown ID"} (${proposalThresholdPercentageFormatted} Total Supply)`
      : "Only Foundation Proposes";

  return (
    <DaoOverviewMetricCard
      title="Proposal Threshold"
      text={text}
      subText="Minimum voting power to submit"
      className={COMMON_CARD_CLASSES}
      isLoading={isLoading}
    />
  );
};

const VotingPeriodMetric = ({
  votingPeriod,
  votingDelay,
  blockTime,
  isLoading,
}: {
  votingPeriod: number;
  votingDelay: number;
  blockTime: number;
  isLoading: boolean;
}) => {
  return (
    <DaoOverviewMetricCard
      title="Voting Period"
      text={`${formatBlocksToUserReadable(votingPeriod, blockTime, true)} to vote`}
      subText={
        <span>
          Starts after{" "}
          <Badge>
            {formatBlocksToUserReadable(votingDelay, blockTime, true) || "N/A"}
          </Badge>{" "}
          delay
        </span>
      }
      isLoading={isLoading}
      className={COMMON_CARD_CLASSES}
      textClassName={TEXT_CLASSES}
    />
  );
};

export const MetricsCard = ({ daoId, daoConfig }: MetricsCardProps) => {
  const {
    proposalThresholdValue,
    proposalThresholdPercentage,
    quorumValueFormatted,
    votingPeriod,
    votingDelay,
    timelockDelay,
    isLoading,
  } = useDaoOverviewData({ daoId: daoId as DaoIdEnum, daoConfig });

  const derivedValues = useMemo(
    () => ({
      proposalThresholdPercentageFormatted: formatProposalThresholdPercentage(
        proposalThresholdPercentage,
      ),
      quorumLogic: daoConfig.daoOverview.rules?.logic,
      executionRules: getExecutionRules(daoConfig),
      blockTime: getBlockTime(daoConfig),
    }),
    [proposalThresholdPercentage, daoConfig],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:justify-between lg:gap-2 lg:border-none">
      <ProposalThresholdMetric
        daoId={daoId}
        proposalThresholdValue={proposalThresholdValue}
        proposalThresholdPercentageFormatted={
          derivedValues.proposalThresholdPercentageFormatted
        }
        isLoading={isLoading}
      />

      <VotingPeriodMetric
        votingPeriod={votingPeriod}
        votingDelay={votingDelay}
        blockTime={derivedValues.blockTime}
        isLoading={isLoading}
      />

      <QuorumMetric
        daoId={daoId}
        quorumValueFormatted={quorumValueFormatted}
        quorumLogic={derivedValues.quorumLogic}
        isLoading={isLoading}
      />

      <ExecutionRulesMetric
        executionRules={derivedValues.executionRules}
        timelockDelay={timelockDelay}
        isLoading={isLoading}
      />
    </div>
  );
};
