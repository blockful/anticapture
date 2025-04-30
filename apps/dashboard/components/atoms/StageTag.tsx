"use client";

export enum Stage {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
}

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "border-error text-error bg-[#F87171]",
  [Stage.ONE]: "border-warning text-warning bg-[#FACC15] ",
  [Stage.TWO]: "border-success text-success bg-[#4ADE80]",
};

interface StageTagProps {
  tagStage: Stage;
  daoStage: Stage;
  className?: string;
}

export const StageTag = ({
  tagStage,
  daoStage,
  className = "",
}: StageTagProps) => {
  // Use gray colors when daoStage is less than tagStage
  const stageStyles =
    daoStage < tagStage
      ? "border-middleDark text-foreground"
      : STAGE_STYLES[daoStage] || "border-middleDark text-foreground";

  return (
    <div
      className={`inline-flex rounded-lg border bg-dark px-3 py-1 ${stageStyles} ${className}`}
    >
      <span className="text-sm font-medium">
        <span className="hidden sm:inline">STAGE </span>
        {tagStage}
      </span>
    </div>
  );
};
