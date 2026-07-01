import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";
import type { ProposalDetails } from "@/features/governance/types";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";

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
    <div className="border-border-default flex w-full flex-col gap-3 border">
      <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 p-3">
        <div>
          <p className="text-primary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider">
            // Action
          </p>
        </div>
        <DefaultLink
          href={`${blockExplorerUrl}/address/${proposalAddress}#code`}
          openInNewTab
          className="text-secondary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider"
        >
          Contract
        </DefaultLink>
      </div>

      {proposalAddress && (
        <div className="flex w-full flex-col gap-1 p-3">
          <ProposalInfoText>Proposal Address</ProposalInfoText>
          <div className="flex w-full items-center gap-1">
            <p className="text-link break-all font-mono text-sm font-normal leading-5">
              {proposalAddress}
            </p>
            <CopyAndPasteButton
              textToCopy={proposalAddress}
              customTooltipText={{
                default: "Copy address",
                copied: "Address copied!",
              }}
              iconSize="sm"
              className="shrink-0 p-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};
