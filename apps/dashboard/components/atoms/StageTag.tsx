"use client";

export enum Stage {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
}

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "border-red-500 text-red-500 bg-[#F87171] bg-opacity-[0.08]  ",
  [Stage.ONE]:
    "border-yellow-500 text-yellow-500 bg-[#FACC15] bg-opacity-[0.12]",
  [Stage.TWO]: "border-green-500 text-green-500 bg-[#4ADE80] bg-opacity-[0.12]",
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
      ? "border-gray-500 text-gray-500"
      : STAGE_STYLES[tagStage] || "border-gray-500 text-gray-500";

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
