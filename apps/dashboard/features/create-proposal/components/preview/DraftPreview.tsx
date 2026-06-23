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
        />
      </div>
      <TabsSection proposal={proposal} daoId={daoIdEnum} variant="draft" />
    </div>
  );
};
