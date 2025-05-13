"use client";

import { cn } from "@/lib/client/utils";
import { StageRequirementsTooltip } from "@/features/dao-overview/StageRequirementsTooltip";
import { useState } from "react";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { useEffect } from "react";
import { BulletPoint } from "@/shared/components/icons/BulletPoint";
import { OutlinedBox } from "@/shared/components/OutlinedBox";
import { GovernanceImplementationField } from "@/lib/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/lib/constants";

interface StagesDaoOverviewProps {
  currentStage?: number;
  itemsToNextStage?: number;
  requirements?: string[];
  highRiskItems?: (GovernanceImplementationField & { name: string })[];
  mediumRiskItems?: (GovernanceImplementationField & { name: string })[];
  lowRiskItems?: (GovernanceImplementationField & { name: string })[];
}

export const StagesDaoOverview = ({
  currentStage = 1,
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
        className="flex items-center justify-between gap-1 rounded-lg border-b border-lightDark bg-lightDark p-2 sm:border-none sm:py-0.5"
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
      >
        <div className="flex flex-col justify-start gap-1 px-1 sm:flex-row sm:items-center">
          {/* Stage indicator */}
          <div className="flex gap-2">
            <span
              className={cn(
                "font-mono text-sm font-medium uppercase tracking-wider",
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
          <BulletPoint className="mb-1 hidden text-sm text-middleDark sm:block" />
          {/* Items to next stage */}
          <div className="flex justify-start">
            <button
              className="group border-b border-dashed border-foreground font-mono text-sm font-medium text-white duration-300 hover:border-white"
              onClick={handleButtonClick}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
            >
              <span className="tracking-wider text-white duration-300">
                {highRiskItems.length ||
                  mediumRiskItems.length ||
                  lowRiskItems.length}{" "}
                ITEMS
              </span>
              <span className="tracking-wider text-foreground duration-300 group-hover:text-white">
                {" "}
                TO STAGE {currentStage + 1}
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
          nextStage={currentStage + 1}
          requirements={requirements}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => !isMobile && setShowTooltip(false)}
        />
      )}
    </div>
  );
};
