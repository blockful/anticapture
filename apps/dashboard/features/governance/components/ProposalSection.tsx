"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Address, formatEther } from "viem";
import { BulletDivider } from "@/features/governance/components/BulletDivider";
import { BarChart4, CheckCircle2, Share2 } from "lucide-react";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { GetProposalQuery } from "@anticapture/graphql-client/hooks";
import { formatNumberUserReadable } from "@/shared/utils";

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

  const forVotesPercentage = (Number(proposal.forVotes) / totalVotes) * 100;

  return (
    <div className="border-surface-default flex w-[420px] flex-col gap-2 rounded-lg border p-3">
      <ProposalInfoText>
        <BarChart4 className="text-secondary size-4" /> Current Results
      </ProposalInfoText>

      <div className="flex items-center gap-2">
        {/* Votes  */}
        <div className="flex w-[100px] items-center gap-2">
          <CheckCircle2 className="text-success size-4" />
          <p className="text-primary">For</p>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 w-[184px] bg-[#3F3F46]"></div>

        {/* Votes */}
        <div className="flex w-12 items-center">
          <p className="text-primary">
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
          <p className="text-primary">{forVotesPercentage.toFixed(1)}%</p>
        </div>
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
