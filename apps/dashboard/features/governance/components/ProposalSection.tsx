"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Address } from "viem";
import { BulletDivider } from "@/features/governance/components/BulletDivider";
import { Share2 } from "lucide-react";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

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

  // Load proposal by id

  // If proposal is not found, show 404 page

  // If proposal is found, show proposal section with proposal details

  return (
    <div className="flex w-[420px] flex-col gap-6">
      <div className="border-surface-default flex w-full flex-col gap-3 rounded-lg border p-4">
        <div className="flex w-full items-center justify-start gap-2">
          {/* Badge Ongoing Proposal */}
          <ProposalBadge>Ongoing Proposal</ProposalBadge>

          <BulletDivider />

          {/* Proposer  */}
          <EnsAvatar
            size="sm"
            address={proposal?.proposer as Address}
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

      {/* Results */}
      <div></div>
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
