"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Address, formatEther } from "viem";
import { BulletDivider } from "@/features/governance/components/BulletDivider";
import {
  BarChart4,
  CheckCircle2,
  DivideCircle,
  Share2,
  Users,
  XCircle,
} from "lucide-react";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { GetProposalQuery } from "@anticapture/graphql-client/hooks";
import { formatNumberUserReadable } from "@/shared/utils";
import { getTimeLeftText } from "@/features/governance/utils";

export const ProposalSection = () => {
  const { proposalId } = useParams();

  const { proposal, loading, error } = useProposal({
    proposalId: proposalId as string,
  });

  console.log(proposal);

  if (loading) {
    return (
      <>
        <SkeletonRow className="h-10 w-full" />
        <div className="text-primary p-4">Loading...</div>
      </>
    );
  }

  if (error) {
    return <div className="text-primary p-4">Error: {error.message}</div>;
  }

  if (!proposal) {
    return <div className="text-primary p-4">Proposal not found</div>;
  }

  // Load proposal by id

  // If proposal is not found, show 404 page

  // If proposal is found, show proposal section with proposal details

  return (
    <div className="flex p-5">
      <div className="flex w-[420px] flex-col gap-6">
        <TitleSection proposal={proposal} />

        <ProposalInfoSection proposal={proposal} />
      </div>
    </div>
  );
};

const TitleSection = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="border-surface-default flex w-full flex-col gap-3 rounded-lg border p-4">
      <div className="flex w-full items-center justify-start gap-2">
        {/* Badge Ongoing Proposal */}
        <ProposalBadge>Ongoing Proposal</ProposalBadge>

        <BulletDivider />

        {/* Proposer  */}
        <EnsAvatar
          size="sm"
          address={proposal?.proposerAccountId as Address}
          nameClassName="text-secondary"
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <p className="text-primary">{proposal?.title}</p>
      </div>

      <div className="flex w-full items-center justify-start gap-2">
        <ProposalInfoText>
          <ChatBubbleIcon className="text-secondary size-4" />
          Forum
        </ProposalInfoText>
        <BulletDivider />
        <ProposalInfoText>
          <Share2 className="text-secondary size-4" /> Share
        </ProposalInfoText>
      </div>
    </div>
  );
};

const ProposalInfoSection = ({
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
      <div className="flex w-[420px] flex-col gap-2 p-3">
        <ProposalInfoText>
          <BarChart4 className="text-secondary size-4" /> Current Results
        </ProposalInfoText>

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
                  Number(formatEther(BigInt(proposal.forVotes || "0"))).toFixed(
                    1,
                  ),
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

        <div className="w-full py-3">
          <div className="border-surface-default w-full border-b border-dashed" />
        </div>

        {/* Quorum */}
        <div className="flex items-center gap-2">
          <Users className="text-secondary size-3.5" />
          <p
            className="text-secondary font-roboto-mono text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px]"
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
        </div>
      </div>

      {/* Time Left  */}
      <div className="bg-surface-opacity-brand flex w-full items-center gap-2 p-3">
        <BulletDivider className="bg-link" />
        <p className="text-link font-roboto-mono text-[12px] font-medium uppercase not-italic leading-4 tracking-[0.72px]">
          {timeLeftText}
        </p>
      </div>
    </div>
  );
};

const ProposalBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-surface-opacity-brand text-link font-inter flex rounded-full px-[6px] py-[2px] text-xs">
      {children}
    </div>
  );
};

const ProposalInfoText = ({ children }: { children: React.ReactNode }) => {
  return (
    <p
      className="font-roboto-mono text-secondary flex items-center gap-1 text-[13px] font-medium uppercase leading-[20px] tracking-[0.78px]"
      style={{ fontStyle: "normal" }}
    >
      {children}
    </p>
  );
};
