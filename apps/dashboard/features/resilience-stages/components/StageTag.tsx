"use client";

import { Stage } from "@/shared/types/enums/Stage";

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "border-error text-error bg-error/12",
  [Stage.ONE]: "border-warning text-warning bg-warning/12",
  [Stage.TWO]: "border-success text-success bg-success/12",
  [Stage.NONE]: "border-middle-dark bg-light-dark text-foreground",
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
      ? "border-middle-dark text-foreground"
      : STAGE_STYLES[daoStage] || "border-middle-dark text-foreground";

  return (
    <div
      className={`bg-surface-contrast inline-flex rounded-lg border p-2 py-1 ${stageStyles} ${className}`}
    >
      <span className="text-alternative-sm font-mono leading-[18px] font-medium whitespace-nowrap">
        <span className="hidden sm:inline">STAGE </span>

        {showStageText && <span className="inline sm:hidden">STAGE </span>}
        {tagStage === Stage.NONE ? "?" : tagStage}
      </span>
    </div>
  );
};
