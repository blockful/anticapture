"use client"

import { cn } from "@/lib/client/utils";
import { StarOutlineIcon } from "../atoms/icons/StarOutlineIcon";
import { StageRequirementsTooltip } from "../atoms/StageRequirementsTooltip";
import { useState } from "react";

interface DaoOverviewStageProgressBarProps {
  currentStage?: number;
  totalStages?: number;
  itemsToNextStage?: number;
  requirements?: Array<{ name: string; value: string }>;
}

export const DaoOverviewStageProgressBar = ({
  currentStage = 1,
  totalStages = 2,
  itemsToNextStage = 3,
  requirements = [
    { name: "Nakamoto", value: "10" },
    { name: "Vote Mutability", value: "" },
    { name: "Non-profitable", value: "" },
  ],
}: DaoOverviewStageProgressBarProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const totalBlocks = 8;
  const filledBlocks = 5;

  return (
    <div className="flex w-full max-w-[400px] items-center justify-between rounded-lg bg-lightDark p-2"  onMouseLeave={() => setShowTooltip(false)}>
      {/* Stage indicator */}
      <div className="flex items-center gap-2">
        <StarOutlineIcon className="text-tangerine" />
        <span className="font-roboto text-sm font-medium uppercase tracking-wider text-tangerine">
          Stage {currentStage}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-3 flex flex-1 gap-1">
        {[...Array(totalBlocks)].map((_, index) => (
          <div
            key={index}
            className={cn(`h-2 min-w-1 max-w-3 flex-1`, {
              "bg-tangerine": index < filledBlocks,
              "bg-middleDark": index >= filledBlocks,
              "rounded-l-md": index === 0,
              "rounded-r-md": index === totalBlocks - 1,
            })}
          />
        ))}
      </div>

      {/* Items to next stage */}
      <div className="relative">
        <button
          className="font-roboto text-sm font-medium group"
          onMouseEnter={() => setShowTooltip(true)}
        >
          <span className="text-white tracking-wider group-hover:underline">{itemsToNextStage} ITEMS</span>
          <span className="text-foreground tracking-wider group-hover:underline"> TO STAGE {currentStage + 1}</span>
          {showTooltip && (
            <StageRequirementsTooltip
              currentStage={currentStage}
              nextStage={currentStage + 1}
              requirements={requirements}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
          )}
        </button>
      </div>
    </div>
  );
};
