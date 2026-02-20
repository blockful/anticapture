import { GetProposalQuery } from "@anticapture/graphql-client";
import { getTimeLeftText } from "@/features/governance/utils";
import {
  BarChart4,
  Check,
  CheckCircle2,
  DivideCircle,
  Users,
  XCircle,
} from "lucide-react";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatUnits } from "viem";
import { BulletDivider } from "@/features/governance/components/proposal-overview/BulletDivider";
import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

const VotingProgressBar = ({
  startTimestamp,
  endTimestamp,
  timeLeftText,
}: {
  startTimestamp: string;
  endTimestamp: string;
  timeLeftText: string;
}) => {
  const now = Date.now() / 1000;
  const startTime = parseInt(startTimestamp);
  const endTime = parseInt(endTimestamp);

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

export const ProposalInfoSection = ({
  proposal,
  decimals,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
  decimals: number;
}) => {
  const totalVotes =
    Number(proposal.forVotes) +
    Number(proposal.againstVotes) +
    Number(proposal.abstainVotes);

  const quorumVotes = Number(proposal.forVotes) + Number(proposal.abstainVotes);

  const timeLeftText = getTimeLeftText(proposal.endTimestamp);

  const forVotesPercentage =
    totalVotes === 0 ? 0 : (Number(proposal.forVotes) / totalVotes) * 100;
  const againstVotesPercentage =
    totalVotes === 0 ? 0 : (Number(proposal.againstVotes) / totalVotes) * 100;
  const abstainVotesPercentage =
    totalVotes === 0 ? 0 : (Number(proposal.abstainVotes) / totalVotes) * 100;

  return (
    <div className="border-border-default flex w-full flex-col border lg:w-[420px]">
      <div className="flex w-full flex-col p-3 lg:w-[420px]">
        <ProposalInfoText className="pb-4">
          <BarChart4 className="text-secondary size-4" /> Current Results
        </ProposalInfoText>

        <div className="flex flex-col gap-3 lg:w-full">
          {/* For Votes */}
          <div className="flex w-full items-center justify-between gap-2 lg:justify-start">
            {/* Votes  */}
            <div className="flex w-[100px] shrink-0 items-center gap-2">
              <CheckCircle2 className="text-success size-3.5" />
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                For
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-1 w-full bg-[#3F3F46] lg:w-[184px] lg:flex-1">
              <div
                className="bg-success absolute h-full"
                style={{ width: `${forVotesPercentage}%` }}
              />
            </div>

            {/* Votes */}
            <div className="flex w-[100px] items-center gap-2">
              <div className="flex w-12 items-center">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {formatNumberUserReadable(
                    Number(
                      formatUnits(BigInt(proposal.forVotes || "0"), decimals),
                    ),
                    0,
                  )}
                </p>
              </div>

              {/* Votes Percentage */}
              <div className="flex w-12 items-center">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {forVotesPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Against Votes */}
          <div className="flex w-full items-center justify-between gap-2 lg:justify-start">
            {/* Votes  */}
            <div className="flex w-[100px] shrink-0 items-center gap-2">
              <XCircle className="text-error size-3.5" />
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                Against
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-1 w-full bg-[#3F3F46] lg:w-[184px] lg:flex-1">
              <div
                className="bg-error absolute h-full"
                style={{ width: `${againstVotesPercentage}%` }}
              />
            </div>

            {/* Votes */}
            <div className="flex w-[100px] items-center gap-2">
              <div className="flex w-12 items-center">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {formatNumberUserReadable(
                    Number(
                      formatUnits(
                        BigInt(proposal.againstVotes || "0"),
                        decimals,
                      ),
                    ),
                    0,
                  )}
                </p>
              </div>

              {/* Votes Percentage */}
              <div className="flex w-12 items-center">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {againstVotesPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Abstain Votes */}
          <div className="flex w-full items-center justify-between gap-2 lg:justify-start">
            {/* Votes  */}
            <div className="flex w-[100px] shrink-0 items-center gap-2">
              <DivideCircle className="text-secondary size-3.5" />
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                Abstain
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-1 w-full bg-[#3F3F46] lg:w-[184px] lg:flex-1">
              <div
                className="bg-secondary absolute h-full"
                style={{ width: `${abstainVotesPercentage}%` }}
              />
            </div>

            {/* Votes */}
            <div className="flex w-[100px] items-center gap-2">
              <div className="flex w-12 items-center">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {formatNumberUserReadable(
                    Number(
                      formatUnits(
                        BigInt(proposal.abstainVotes || "0"),
                        decimals,
                      ),
                    ),
                    0,
                  )}
                </p>
              </div>

              {/* Votes Percentage */}
              <div className="flex w-12 items-center">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {abstainVotesPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
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
          startTimestamp={proposal.startTimestamp}
          endTimestamp={proposal.endTimestamp}
          timeLeftText={timeLeftText}
        />
      )}
    </div>
  );
};
