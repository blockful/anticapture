"use client";

import { Stage } from "@/shared/types/enums/Stage";

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "border-error text-error bg-error bg-opacity-[0.12]",
  [Stage.ONE]: "border-warning text-warning bg-warning bg-opacity-[0.12]",
  [Stage.TWO]: "border-success text-success bg-success bg-opacity-[0.12]",
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
      className={`inline-flex rounded-lg border bg-dark p-2 py-1 ${stageStyles} ${className}`}
    >
      <span className="whitespace-nowrap font-mono text-alternative-sm font-medium leading-[18px]">
        <span className="hidden sm:inline">STAGE </span>

        {showStageText && <span className="inline sm:hidden">STAGE </span>}
        {tagStage === Stage.NONE ? "?" : tagStage}
      </span>
    </div>
  );
};
