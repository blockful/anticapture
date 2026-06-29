"use client";

import { useEncodedDraftActions } from "@/features/create-proposal/hooks/useEncodedDraftActions";
import { draftToProposalViewData } from "@/features/create-proposal/utils/draftToProposalViewData";
import { DraftPreviewSidebar } from "@/features/create-proposal/components/preview/DraftPreviewSidebar";
import type { ProposalAction } from "@/features/create-proposal/types";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import type { DaoIdEnum } from "@/shared/types/daos";

interface DraftPreviewProps {
  daoId: string;
  daoIdEnum: DaoIdEnum;
  title: string;
  discussionUrl: string;
  body: string;
  actions: ProposalAction[];
  authorAddress: string;
  helperCopy: string;
  secondaryAction: "copy-link" | "edit";
  onPublish: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
  publishDisabled?: boolean;
  editDisabled?: boolean;
  isWhitelabelRoute?: boolean;
}

export const DraftPreview = ({
  daoId,
  daoIdEnum,
  title,
  discussionUrl,
  body,
  actions,
  authorAddress,
  helperCopy,
  secondaryAction,
  onPublish,
  onCopyLink,
  onEdit,
  publishDisabled,
  editDisabled,
  isWhitelabelRoute = false,
}: DraftPreviewProps) => {
  const { encoded } = useEncodedDraftActions(actions, daoId);

  const proposal = draftToProposalViewData(
    {
      id: "preview",
      daoId,
      author: authorAddress,
      title,
      discussionUrl,
      body,
      actions,
      createdAt: 0,
      updatedAt: 0,
    },
    encoded,
  );

  return (
    <div className="mx-auto w-full">
      {/* Sticky spacer that masks the 65→85px band so content doesn't show above
          the tab bar. Only needed alongside the non-whitelabel desktop header
          (the 65px bar); in whitelabel that header isn't rendered, so the spacer
          would just show as a stray band over the content. */}
      {!isWhitelabelRoute && (
        <div className="bg-surface-background sticky top-[65px] z-10 hidden h-5 w-full lg:block" />
      )}
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
        <div className="flex h-fit w-full flex-col gap-4 lg:sticky lg:top-[85px] lg:w-[420px]">
          <DraftPreviewSidebar
            title={title}
            authorAddress={authorAddress}
            helperCopy={helperCopy}
            secondaryAction={secondaryAction}
            onPublish={onPublish}
            onCopyLink={onCopyLink}
            onEdit={onEdit}
            publishDisabled={publishDisabled}
            editDisabled={editDisabled}
          />
        </div>
        <TabsSection
          proposal={proposal}
          daoId={daoIdEnum}
          variant="draft"
          isWhitelabel={isWhitelabelRoute}
        />
      </div>
    </div>
  );
};
