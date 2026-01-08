import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BulletDivider } from "@/features/governance/components/proposal-overview/BulletDivider";

import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Share2 } from "lucide-react";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { Address } from "viem";
import { ProposalBadge } from "@/features/governance/components/proposal-overview/ProposalBadge";
import { ProposalStatus } from "@/features/governance/types";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";

export const TitleSection = ({
  proposal,
  daoId,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
  daoId: DaoIdEnum;
}) => {
  const chainId = daoConfig[daoId].daoOverview.chain.id;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full items-center justify-start gap-2">
        {/* Badge Ongoing Proposal */}
        <ProposalBadge
          status={proposal.status.toLowerCase() as ProposalStatus}
        />

        <BulletDivider />

        {/* Proposer  */}
        <EnsAvatar
          chainId={chainId}
          size="xs"
          address={proposal?.proposerAccountId as Address}
          nameClassName="text-secondary"
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <h4 className="text-primary">{proposal?.title}</h4>
      </div>

      <div className="flex w-full items-center justify-start gap-2">
        <DefaultLink
          href="https://discuss.ens.domains/c/dao-wide/active-proposals/52"
          openInNewTab
        >
          <ChatBubbleIcon className="size-4" />
          Forum
        </DefaultLink>

        <BulletDivider />

        {/* @todo - add the correct link */}
        <DefaultLink href={`https://x.com/home`} openInNewTab>
          <Share2 className="size-4" /> Share
        </DefaultLink>
      </div>
    </div>
  );
};
