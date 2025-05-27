"use client";

import { cn } from "@/shared/utils/";
import { StageRequirementsTooltip } from "@/features/dao-overview/components/StageRequirementsTooltip";
import { useState } from "react";
import { useScreenSize } from "@/shared/hooks";
import { useEffect } from "react";
import { BulletPoint } from "@/shared/components/icons";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { Stage } from "@/shared/types/enums/Stage";
interface StagesDaoOverviewProps {
  currentStage?: Stage;
  itemsToNextStage?: number;
  requirements?: string[];
  highRiskItems?: (GovernanceImplementationField & { name: string })[];
  mediumRiskItems?: (GovernanceImplementationField & { name: string })[];
  lowRiskItems?: (GovernanceImplementationField & { name: string })[];
}

export const StagesDaoOverview = ({
  currentStage = Stage.ONE,
  itemsToNextStage = 3,
  highRiskItems = [],
  mediumRiskItems = [],
  lowRiskItems = [],
}: StagesDaoOverviewProps) => {
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

  const requirements =
    highRiskItems.length > 0
      ? highRiskItems.map((item) => item.name)
      : mediumRiskItems.length > 0
        ? mediumRiskItems.map((item) => item.name)
        : [];

  const handleButtonClick = () => {
    if (isMobile) {
      setShowTooltip(!showTooltip);
    } else {
      const section = document.getElementById(
        SECTIONS_CONSTANTS.resilienceStages.anchorId,
      );
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative w-full py-0 sm:w-full">
      <div
        className="border-light-dark bg-light-dark flex items-center justify-between gap-1 rounded-lg border-b p-2 sm:border-none sm:py-0.5"
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
      >
        <div className="flex flex-col justify-start gap-1 px-1 sm:flex-row sm:items-center">
          {/* Stage indicator */}
          <div className="flex gap-2">
            <span
              className={cn(
                "font-mono text-sm font-medium tracking-wider uppercase",
                {
                  "text-error": currentStage === Stage.ZERO,
                  "text-warning": currentStage === Stage.ONE,
                  "text-success": currentStage === Stage.TWO,
                },
              )}
            >
              Stage {currentStage}
            </span>
          </div>
          <BulletPoint className="text-middle-dark mb-1 hidden text-sm sm:block" />
          {/* Items to next stage */}
          <div className="flex justify-start">
            <button
              className="border-foreground group text-primary cursor-pointer border-b border-dashed font-mono text-sm font-medium duration-300 hover:border-white"
              onClick={handleButtonClick}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
            >
              <span className="text-primary tracking-wider duration-300">
                {highRiskItems.length ||
                  mediumRiskItems.length ||
                  lowRiskItems.length}{" "}
                ITEMS
              </span>
              <span className="text-foreground group-hover:text-primary tracking-wider duration-300">
                {" "}
                TO STAGE {Number(currentStage) + 1}
              </span>
            </button>
          </div>
        </div>
        <div className="flex gap-1 p-2 pr-0 sm:gap-2">
          <OutlinedBox
            variant="error"
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">{highRiskItems.length}</span>
          </OutlinedBox>
          <OutlinedBox
            variant="warning"
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">{mediumRiskItems.length}</span>
          </OutlinedBox>
          <OutlinedBox
            variant="success"
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">{lowRiskItems.length}</span>
          </OutlinedBox>
        </div>
      </div>
      {showTooltip && (
        <StageRequirementsTooltip
          currentStage={currentStage}
          nextStage={Number(currentStage) + 1}
          requirements={requirements}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => !isMobile && setShowTooltip(false)}
        />
      )}
    </div>
  );
};
