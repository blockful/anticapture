"use client";

import { Stage } from "@/shared/types/enums/Stage";
import { cn } from "@/shared/utils";

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "text-error bg-surface-opacity-error",
  [Stage.ONE]: "text-warning bg-surface-opacity-warning",
  [Stage.TWO]: "text-success bg-surface-opacity-success",
  [Stage.NONE]: "bg-surface-opacity text-secondary",
  [Stage.UNKNOWN]: "bg-surface-opacity text-secondary",
};

interface StageTagProps {
  tagStage: Stage;
  daoStage: Stage;
  className?: string;
  showStageText?: boolean;
}

export const StageTag = ({
  tagStage,
  daoStage,
  className = "",
  showStageText = false,
}: StageTagProps) => {
  // Use gray colors when daoStage is less than tagStage
  const stageStyles =
    daoStage < tagStage
      ? "text-secondary"
      : STAGE_STYLES[daoStage] || "text-secondary";

  const showNoTag = daoStage === Stage.NONE && daoStage === tagStage;

  return (
    <div
      className={cn(
        "bg-surface-contrast inline-flex h-7 items-center px-2 py-1",
        stageStyles,
        className,
      )}
    >
      <span className="text-alternative-sm whitespace-nowrap font-mono text-[13px] font-medium leading-[20px]">
        {showNoTag && "NO "}
        <span className="hidden sm:inline">STAGE </span>

        {showStageText && <span className="inline sm:hidden">STAGE </span>}
        {tagStage === Stage.UNKNOWN ? "?" : !showNoTag && tagStage}
      </span>
    </div>
  );
};
