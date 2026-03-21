"use client";

import type { GetProposalQuery } from "@anticapture/graphql-client";
import type { Address } from "viem";

import { ProposalBadge } from "@/features/governance/components/proposal-overview/ProposalBadge";
import type { ProposalStatus } from "@/features/governance/types";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BulletDivider } from "@/shared/components/design-system/section";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const XLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DAO_TWITTER_HANDLES: Record<string, string> = {
  ENS: "@ENS_DAO",
  UNI: "@Uniswap",
  COMP: "@compoundfinance",
  NOUNS: "@nounsdao",
  GTC: "@gitcoin",
  SCR: "@Scroll_ZKP",
  OBOL: "@Obol_Collective",
  OP: "@OptimismGov",
};

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

  const daoIdKey = proposal.daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdKey];
  const twitterHandle = DAO_TWITTER_HANDLES[proposal.daoId.toUpperCase()] ?? "";
  const proposalLink = `https://anticapture.com/${proposal.daoId.toLowerCase()}/governance/proposal/${proposal.id}`;
  const twitterText = `🗳️ [${daoConfig?.name ?? proposal.daoId.toUpperCase()} DAO] PROPOSAL DETECTED — STATUS: [${proposal.status.toUpperCase()}] // This transmission needs a response. ${twitterHandle} ${proposalLink}`;

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
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(twitterText)}`}
          openInNewTab
        >
          <XLogo className="size-4" /> Share
        </DefaultLink>
      </div>
    </div>
  );
};
