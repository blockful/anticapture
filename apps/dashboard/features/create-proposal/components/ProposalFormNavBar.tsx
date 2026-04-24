"use client";

import { Rocket } from "lucide-react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";

interface ProposalFormNavBarProps {
  filledCount: number;
  totalCount: number;
  canPublish: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSavingDraft?: boolean;
}

export const ProposalFormNavBar = ({
  filledCount,
  totalCount,
  canPublish,
  onSaveDraft,
  onPublish,
  isSavingDraft = false,
}: ProposalFormNavBarProps) => {
  const percent = (filledCount / totalCount) * 100;
  return (
    <div className="bg-surface-default border-border-default h-15 sticky bottom-0 flex items-center justify-between gap-4 border-t px-5 py-2">
      <ProgressBar
        value={percent}
        label={`${filledCount}/${totalCount}`}
        labelPosition="left"
        className="max-w-xs flex-1"
      />
      <div className="flex shrink-0 gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={onSaveDraft}
          loading={isSavingDraft}
        >
          Save Draft
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!canPublish}
          onClick={onPublish}
        >
          <Rocket className="size-4" />
          Publish
        </Button>
      </div>
    </div>
  );
};
