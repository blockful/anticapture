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
import { formatEther } from "viem";
import { BulletDivider } from "@/features/governance/components/proposal-overview/BulletDivider";
import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";

export const ProposalInfoSection = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const totalVotes =
    Number(proposal.forVotes) +
    Number(proposal.againstVotes) +
    Number(proposal.abstainVotes);

  const quorumVotes = Number(proposal.forVotes) + Number(proposal.abstainVotes);

  const timeLeftText = getTimeLeftText(proposal.endTimestamp);

  const forVotesPercentage = (Number(proposal.forVotes) / totalVotes) * 100;
  const againstVotesPercentage =
    (Number(proposal.againstVotes) / totalVotes) * 100;
  const abstainVotesPercentage =
    (Number(proposal.abstainVotes) / totalVotes) * 100;

  return (
    <div className="border-surface-default flex w-[420px] flex-col border">
      <div className="flex w-[420px] flex-col p-3">
        <ProposalInfoText className="pb-4">
          <BarChart4 className="text-secondary size-4" /> Current Results
        </ProposalInfoText>

        <div className="flex flex-col gap-3">
          {/* For Votes */}
          <div className="flex items-center gap-2">
            {/* Votes  */}
            <div className="flex w-[100px] items-center gap-2">
              <CheckCircle2 className="text-success size-3.5" />
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                For
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-1 w-[184px] bg-[#3F3F46]">
              <div
                className="bg-success absolute h-full"
                style={{ width: `${forVotesPercentage}%` }}
              />
            </div>

            {/* Votes */}
            <div className="flex w-12 items-center">
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                {formatNumberUserReadable(
                  Number(
                    Number(
                      formatEther(BigInt(proposal.forVotes || "0")),
                    ).toFixed(1),
                  ),
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

          {/* Against Votes */}
          <div className="flex items-center gap-2">
            {/* Votes  */}
            <div className="flex w-[100px] items-center gap-2">
              <XCircle className="text-error size-3.5" />
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                Against
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-1 w-[184px] bg-[#3F3F46]">
              <div
                className="bg-error absolute h-full"
                style={{ width: `${againstVotesPercentage}%` }}
              />
            </div>

            {/* Votes */}
            <div className="flex w-12 items-center">
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                {formatNumberUserReadable(
                  Number(
                    Number(
                      formatEther(BigInt(proposal.againstVotes || "0")),
                    ).toFixed(1),
                  ),
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

          {/* Abstain Votes */}
          <div className="flex items-center gap-2">
            {/* Votes  */}
            <div className="flex w-[100px] items-center gap-2">
              <DivideCircle className="text-secondary size-3.5" />
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                Abstain
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-1 w-[184px] bg-[#3F3F46]"></div>

            {/* Votes */}
            <div className="flex w-12 items-center">
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                {formatNumberUserReadable(
                  Number(
                    Number(
                      formatEther(BigInt(proposal.abstainVotes || "0")),
                    ).toFixed(1),
                  ),
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

        <div className="w-full py-3">
          <div className="border-surface-default w-full border-b border-dashed" />
        </div>

        {/* Quorum */}
        <div className="flex items-center gap-2">
          <Users className="text-secondary size-3.5" />
          <p
            className="text-secondary font-mono text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px]"
            style={{ fontStyle: "normal" }}
          >
            Quorum
          </p>
          <BulletDivider />
          <p className="font-inter text-secondary text-[14px] font-normal not-italic leading-[20px]">
            {formatNumberUserReadable(Number(formatEther(BigInt(quorumVotes))))}{" "}
            /{" "}
            {formatNumberUserReadable(
              Number(formatEther(BigInt(proposal.quorum))),
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

      {/* Time Left  */}
      {proposal.status.toLowerCase() === "active" && (
        <div className="bg-surface-opacity-brand flex w-full items-center gap-2 p-3">
          <BulletDivider className="bg-link" />
          <p className="text-link font-mono text-[12px] font-medium uppercase not-italic leading-4 tracking-[0.72px]">
            {timeLeftText}
          </p>
        </div>
      )}
    </div>
  );
};
