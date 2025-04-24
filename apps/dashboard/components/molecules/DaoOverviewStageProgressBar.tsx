"use client";

import { cn } from "@/lib/client/utils";
import { StarOutlineIcon } from "../atoms/icons/StarOutlineIcon";
import { StageRequirementsTooltip } from "../atoms/StageRequirementsTooltip";
import { useState } from "react";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { useEffect } from "react";

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
  const { isMobile } = useScreenSize();
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      setShowTooltip(false);
    };

    document.addEventListener("click", handleClick);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [showTooltip]);
  return (
    <div className="relative">
      <div
        className="flex w-full items-center justify-between sm:rounded-lg bg-darkest p-2 sm:max-w-[400px] sm:bg-lightDark border-b border-lightDark sm:border-none"
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
      >
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
              className={cn(`h-2 min-w-1 sm:max-w-3 flex-1`, {
                "bg-tangerine": index < filledBlocks,
                "bg-middleDark": index >= filledBlocks,
                "rounded-l-md": index === 0,
                "rounded-r-md": index === totalBlocks - 1,
              })}
            />
          ))}
        </div>

        {/* Items to next stage */}
        <div>
          <button
            className="font-roboto group text-sm font-medium"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="tracking-wider text-white group-hover:underline">
              {itemsToNextStage} ITEMS
            </span>
            <span className="tracking-wider text-foreground group-hover:underline">
              {" "}
              TO STAGE {currentStage + 1}
            </span>
          </button>
        </div>
      </div>
      {showTooltip && (
        <StageRequirementsTooltip
          currentStage={currentStage}
          nextStage={currentStage + 1}
          requirements={requirements}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => !isMobile && setShowTooltip(false)}
        />
      )}
    </div>
  );
};
