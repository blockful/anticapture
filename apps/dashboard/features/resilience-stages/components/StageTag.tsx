"use client";

import { Stage } from "@/shared/types/enums/Stage";

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "border-error text-error bg-surface-opacity-error",
  [Stage.ONE]: "border-warning text-warning bg-surface-opacity-warning",
  [Stage.TWO]: "border-success text-success bg-surface-opacity-success",
  [Stage.NONE]: "border-middle-dark bg-surface-contrast text-secondary",
  [Stage.UNKNOWN]: "border-middle-dark bg-surface-contrast text-secondary",
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
      ? "border-middle-dark text-secondary"
      : STAGE_STYLES[daoStage] || "border-middle-dark text-secondary";

  const showNoTag = daoStage === Stage.NONE && daoStage === tagStage;

  return (
    <div
      className={`bg-surface-contrast inline-flex rounded-lg border p-2 py-1 ${stageStyles} ${className}`}
    >
      <span className="text-alternative-sm whitespace-nowrap font-mono font-medium leading-[18px]">
        {showNoTag && "NO "}
        <span className="hidden sm:inline">STAGE </span>

        {showStageText && <span className="inline sm:hidden">STAGE </span>}
        {tagStage === Stage.UNKNOWN ? "?" : !showNoTag && tagStage}
      </span>
    </div>
  );
};
