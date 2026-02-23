"use client";

import { GetProposalQuery } from "@anticapture/graphql-client";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Share2 } from "lucide-react";
import { Address } from "viem";

import { ProposalBadge } from "@/features/governance/components/proposal-overview/ProposalBadge";
import { ProposalStatus } from "@/features/governance/types";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BulletDivider } from "@/shared/components/design-system/section/BulletDivider";

interface TitleSectionProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
  onAddressClick?: (address: string) => void;
}

export const TitleSection = ({
  proposal,
  onAddressClick,
}: TitleSectionProps) => {
  const handleOpenDrawer = () => {
    if (proposal?.proposerAccountId) {
      onAddressClick?.(proposal.proposerAccountId);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full items-center justify-start gap-2">
        {/* Badge Ongoing Proposal */}
        <ProposalBadge
          status={proposal.status.toLowerCase() as ProposalStatus}
        />

        <BulletDivider className="bg-border-contrast" />

        {/* Proposer - Clickable to open delegate drawer */}
        <button
          onClick={handleOpenDrawer}
          className="group cursor-pointer rounded-md p-1"
        >
          <EnsAvatar
            size="xs"
            address={proposal?.proposerAccountId as Address}
            nameClassName="text-secondary group-hover:border-primary transition-colors duration-200"
            isDashed
          />
        </button>
      </div>

      <div className="flex w-full flex-col gap-2">
        <h4 className="text-primary text-xl">{proposal?.title}</h4>
      </div>

      <div className="flex w-full items-center justify-start gap-2">
        <DefaultLink
          href="https://discuss.ens.domains/c/dao-wide/active-proposals/52"
          openInNewTab
        >
          <ChatBubbleIcon className="size-4" />
          Forum
        </DefaultLink>

        <BulletDivider className="bg-border-contrast" />

        <DefaultLink
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(`See this new proposal at Anticapture! https://anticapture.com/${proposal.daoId.toLowerCase()}/governance/proposal/${proposal.id}`)}`}
          openInNewTab
        >
          <Share2 className="size-4" /> Share
        </DefaultLink>
      </div>
    </div>
  );
};
