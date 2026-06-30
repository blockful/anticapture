import { Info } from "lucide-react";

import { ProposalBadge } from "@/features/governance/components/proposal-overview/ProposalBadge";
import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";
import type { ProposalDetails } from "@/features/governance/types";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";

const formatDateTime = (timestamp: number): string =>
  new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Shown on the Actions tab for proposals without executable actions (e.g. Tornado
 * Cash, whose proposals carry only a target and no calldata). Surfaces the core
 * proposal metadata in place of an empty action list.
 */
export const ProposalActionsInfoCard = ({
  proposal,
  blockExplorerUrl,
}: {
  proposal: ProposalDetails;
  blockExplorerUrl: string;
}) => {
  const proposalAddress = proposal.targets?.[0] ?? null;

  return (
    <div className="border-border-default flex w-full flex-col gap-3 border p-3">
      <div className="flex items-center gap-2">
        <Info className="text-secondary size-4" />
        <ProposalInfoText>Info</ProposalInfoText>
      </div>

      {proposalAddress && (
        <div className="flex w-full flex-col gap-1">
          <ProposalInfoText>Proposal Address</ProposalInfoText>
          <DefaultLink
            href={`${blockExplorerUrl}/address/${proposalAddress}`}
            openInNewTab
            variant="highlight"
            className="break-all normal-case tracking-normal"
          >
            {proposalAddress}
          </DefaultLink>
        </div>
      )}

      <div className="flex w-full gap-8">
        <div className="flex flex-col gap-1">
          <ProposalInfoText>ID</ProposalInfoText>
          <p className="text-primary font-mono text-sm font-normal leading-5">
            {proposal.id}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <ProposalInfoText>Status</ProposalInfoText>
          <div>
            <ProposalBadge status={proposal.status} />
          </div>
        </div>
      </div>

      <div className="flex w-full gap-8">
        <div className="flex flex-col gap-1">
          <ProposalInfoText>Start Date</ProposalInfoText>
          <p className="text-primary font-mono text-sm font-normal leading-5">
            {formatDateTime(proposal.startTimestamp)}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <ProposalInfoText>End Date</ProposalInfoText>
          <p className="text-primary font-mono text-sm font-normal leading-5">
            {formatDateTime(proposal.endTimestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};
