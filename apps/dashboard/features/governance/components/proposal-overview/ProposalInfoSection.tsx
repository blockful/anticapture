import {
  BarChart4,
  Check,
  CheckCircle2,
  CircleMinus,
  Users,
  XCircle,
} from "lucide-react";
import { formatUnits } from "viem";

import { OffchainResultsCard } from "@/features/governance/components/proposal-overview/OffchainResultsCard";
import type { OffchainVoteIndexingStatus } from "@/features/governance/hooks/useOffchainVoteIndexing";
import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";
import type { ProposalViewData } from "@/features/governance/types";
import { getTimeLeftText } from "@/features/governance/utils";
import { BulletDivider } from "@/shared/components/design-system/section";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { formatNumberUserReadable } from "@/shared/utils";

const VotingProgressBar = ({
  startTimestamp,
  endTimestamp,
  timeLeftText,
}: {
  startTimestamp: number;
  endTimestamp: number;
  timeLeftText: string;
}) => {
  const now = Date.now() / 1000;
  const startTime = Number(startTimestamp);
  const endTime = Number(endTimestamp);

  // Calculate progress percentage (how much time has elapsed)
  const totalDuration = endTime - startTime;
  const elapsedTime = now - startTime;
  const progressPercentage = Math.min(
    Math.max((elapsedTime / totalDuration) * 100, 0),
    100,
  );

  return (
    <div className="bg-surface-opacity-brand relative flex w-full items-center gap-1 overflow-hidden px-2 py-1.5">
      {/* Progress bar fill - positioned at bottom */}
      <div
        className="bg-link/30 absolute bottom-0 left-0 h-full"
        style={{ width: `${progressPercentage}%` }}
      />

      {/* Pulsing indicator */}
      <div className="relative flex size-4 shrink-0 items-center justify-center">
        {/* Pulse ring animation */}
        <div className="bg-link animate-pulse-ring absolute size-1 rounded-full" />
        {/* Static center dot */}
        <div className="bg-link relative size-1 rounded-full" />
      </div>

      {/* Time left text */}
      <p className="text-link font-mono text-[12px] font-medium uppercase not-italic leading-4 tracking-wider">
        {timeLeftText}
      </p>
    </div>
  );
};

interface ProposalInfoSectionProps {
  proposal: ProposalViewData;
  decimals: number;
  offchainChoices?: string[];
  offchainScores?: number[];
  /** Shutter proposals conceal the tally, so the card shows dashes, not zeros. */
  isShutter?: boolean;
  /** Just-signed vote, applied on top of the tally until the indexer catches up. */
  optimisticScores?: number[] | null;
  indexingStatus?: OffchainVoteIndexingStatus;
  isIndexingChipFading?: boolean;
}

export const ProposalInfoSection = ({
  proposal,
  decimals,
  offchainChoices,
  offchainScores,
  isShutter = false,
  optimisticScores = null,
  indexingStatus,
  isIndexingChipFading,
}: ProposalInfoSectionProps) => {
  const timeLeftText = getTimeLeftText(proposal.endTimestamp);

  const isOffchain =
    offchainChoices !== undefined && offchainScores !== undefined;

  if (isOffchain) {
    return (
      <div className="border-border-default flex w-full flex-col border lg:w-[420px]">
        <OffchainResultsCard
          choices={offchainChoices}
          scores={offchainScores}
          end={Number(proposal.endTimestamp)}
          isShutter={isShutter}
          optimisticScores={optimisticScores}
          indexingStatus={indexingStatus}
          isIndexingChipFading={isIndexingChipFading}
          className="border-0"
        />

        {proposal.status.toLowerCase() === "ongoing" && (
          <VotingProgressBar
            startTimestamp={Number(proposal.startTimestamp)}
            endTimestamp={Number(proposal.endTimestamp)}
            timeLeftText={timeLeftText}
          />
        )}
      </div>
    );
  }

  // --- Onchain (hardcoded For / Against / Abstain) path ---
  const totalVotes =
    Number(proposal.forVotes) +
    Number(proposal.againstVotes) +
    Number(proposal.abstainVotes);

  const quorumVotes = Number(proposal.forVotes) + Number(proposal.abstainVotes);

  const choicePercentage = (raw: string) =>
    totalVotes === 0 ? 0 : (Number(raw) / totalVotes) * 100;

  const onchainRows = [
    {
      label: "For",
      icon: <CheckCircle2 className="text-success size-3.5" />,
      barClass: "bg-success",
      rawVotes: proposal.forVotes || "0",
      percentage: choicePercentage(proposal.forVotes),
    },
    {
      label: "Against",
      icon: <XCircle className="text-error size-3.5" />,
      barClass: "bg-error",
      rawVotes: proposal.againstVotes || "0",
      percentage: choicePercentage(proposal.againstVotes),
    },
    {
      label: "Abstain",
      icon: <CircleMinus className="text-secondary size-3.5" />,
      barClass: "bg-secondary",
      rawVotes: proposal.abstainVotes || "0",
      percentage: choicePercentage(proposal.abstainVotes),
    },
  ];

  return (
    <div className="border-border-default flex w-full flex-col border lg:w-[420px]">
      <div className="flex w-full flex-col p-3 lg:w-[420px]">
        <ProposalInfoText className="pb-4">
          <BarChart4 className="text-secondary size-4" /> Current Results
        </ProposalInfoText>

        <div className="flex flex-col gap-3 lg:w-full">
          {onchainRows.map((row) => (
            <div
              key={row.label}
              className="flex w-full items-center justify-between gap-2 lg:justify-start"
            >
              <div className="flex w-[100px] shrink-0 items-center gap-2">
                {row.icon}
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {row.label}
                </p>
              </div>

              <div className="bg-surface-contrast relative h-1 w-full lg:w-[184px] lg:flex-1">
                <div
                  className={`${row.barClass} absolute h-full`}
                  style={{ width: `${row.percentage}%` }}
                />
              </div>

              <div className="flex w-[100px] items-center gap-2">
                <div className="flex w-12 items-center">
                  <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                    {formatNumberUserReadable(
                      Number(formatUnits(BigInt(row.rawVotes), decimals)),
                      0,
                    )}
                  </p>
                </div>
                <div className="flex w-12 items-center">
                  <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                    {row.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full py-3">
          <div className="border-surface-default w-full border-b border-dashed" />
        </div>

        {/* Quorum */}
        <div className="flex items-center gap-2">
          <Users className="text-secondary size-3.5" />
          <Tooltip tooltipContent='Only "For" and "Abstain" votes are counted'>
            <p className="text-secondary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px] transition-colors duration-300">
              Quorum
            </p>
          </Tooltip>
          <BulletDivider />
          <p className="font-inter text-secondary text-[14px] font-normal not-italic leading-[20px]">
            {formatNumberUserReadable(
              Number(formatUnits(BigInt(quorumVotes), decimals)),
            )}{" "}
            /{" "}
            {formatNumberUserReadable(
              Number(formatUnits(BigInt(proposal.quorum), decimals)),
            )}
          </p>
          {quorumVotes >= Number(proposal.quorum) && (
            <div className="bg-surface-opacity-success flex items-center gap-1 rounded-full px-[6px] py-[2px]">
              <Check className="text-success size-3.5" />
              <p className="text-success font-inter text-[12px] font-medium not-italic leading-4">
                Reached
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Time Left Progress Bar */}
      {proposal.status.toLowerCase() === "ongoing" && (
        <VotingProgressBar
          startTimestamp={Number(proposal.startTimestamp)}
          endTimestamp={Number(proposal.endTimestamp)}
          timeLeftText={timeLeftText}
        />
      )}
    </div>
  );
};
