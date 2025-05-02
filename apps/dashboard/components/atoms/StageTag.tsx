"use client";

export enum Stage {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
}

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "border-error text-error bg-error bg-opacity-[0.12]",
  [Stage.ONE]: "border-warning text-warning bg-warning bg-opacity-[0.12]",
  [Stage.TWO]: "border-success text-success bg-success bg-opacity-[0.12]",
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
      className={`inline-flex rounded-lg border-[1px] bg-dark p-2 py-1 ${stageStyles} ${className}`}
    >
      <span className="font-roboto text-[13px] font-medium leading-[18px]">
        <span className="hidden sm:inline">STAGE </span>
        {tagStage}
      </span>
    </div>
  );
};
