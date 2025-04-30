"use client";

import { cn } from "@/lib/client/utils";
import { StageRequirementsTooltip } from "@/components/atoms/StageRequirementsTooltip";
import { useState } from "react";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { useEffect } from "react";
import { BulletPoint } from "@/components/atoms/icons/BulletPoint";
import { OutlinedBox } from "@/components/atoms/OutlinedBox";

interface DaoOverviewStageProgressBarProps {
  currentStage?: number;
  itemsToNextStage?: number;
  requirements?: string[];
}

export const DaoOverviewStageProgressBar = ({
  currentStage = 1,
  itemsToNextStage = 3,
  requirements = ["Nakamoto > 10", "Vote Mutability", "Non-profitable"],
}: DaoOverviewStageProgressBarProps) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
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
    <div className="relative w-max py-0">
      <div
        className="flex items-center justify-between gap-1 border-b border-lightDark bg-darkest p-2 py-0.5 sm:rounded-lg sm:border-none sm:bg-lightDark"
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
      >
        {/* Stage indicator */}
        <div className="flex gap-2">
          <span
            className={cn(
              "font-roboto text-sm font-medium uppercase tracking-wider",
              {
                "text-error": currentStage === 0,
                "text-warning": currentStage === 1,
                "text-success": currentStage === 2,
              },
            )}
          >
            Stage {currentStage}
          </span>
        </div>
        <BulletPoint className="mb-1 text-sm text-middleDark" />
        {/* Items to next stage */}
        <div className="flex">
          <button
            className="group font-roboto text-sm font-medium"
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
        <div className="flex gap-2 p-2 pr-0">
          <OutlinedBox
            variant="error"
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">10</span>
          </OutlinedBox>
          <OutlinedBox
            variant="warning"
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">10</span>
          </OutlinedBox>
          <OutlinedBox
            variant="success"
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">10</span>
          </OutlinedBox>
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
