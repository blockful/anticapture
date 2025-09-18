import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BulletDivider } from "@/features/governance/components/proposal-overview/BulletDivider";

import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Share2 } from "lucide-react";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { Address } from "viem";
import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";
import { ProposalBadge } from "@/features/governance/components/proposal-overview/ProposalBadge";
import { getStatusText } from "@/features/governance/components/proposal-overview/ProposalItem";
import { ProposalStatus } from "@/features/governance/types";

export const TitleSection = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="border-surface-default flex w-full flex-col gap-3 rounded-lg border p-4">
      <div className="flex w-full items-center justify-start gap-2">
        {/* Badge Ongoing Proposal */}
        <ProposalBadge>
          {getStatusText(proposal.status.toLowerCase() as ProposalStatus)}
        </ProposalBadge>

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
