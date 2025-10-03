"use client";

import { cn, formatPlural } from "@/shared/utils/";
import { StageRequirementsTooltip } from "@/features/dao-overview/components/StageRequirementsTooltip";
import { useState } from "react";
import { useScreenSize } from "@/shared/hooks";
import { useEffect } from "react";
import { BulletPoint } from "@/shared/components/icons";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { Stage } from "@/shared/types/enums/Stage";
import { Button } from "@/shared/components";
interface StagesDaoOverviewProps {
  currentStage?: Stage;
  itemsToNextStage?: number;
  requirements?: string[];
  highRiskItems?: (GovernanceImplementationField & { name: string })[];
  mediumRiskItems?: (GovernanceImplementationField & { name: string })[];
  lowRiskItems?: (GovernanceImplementationField & { name: string })[];
}

export const StagesDaoOverview = ({
  currentStage = Stage.UNKNOWN,
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

  const stageToText = (stage: Stage) => {
    if (stage === Stage.UNKNOWN) {
      return "?";
    }
    return stage;
  };

  return (
    <div className="relative w-full py-0 sm:w-full">
      <div
        className="border-light-dark bg-surface-contrast flex items-center justify-between gap-1 rounded-lg border-b p-2 sm:border-none sm:py-0.5"
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
      >
        <div className="flex flex-col justify-start gap-1 px-1 sm:flex-row sm:items-center">
          {/* Stage indicator */}
          <div className="flex gap-2">
            <span
              className={cn(
                "!text-alternative-sm font-mono font-medium uppercase",
                {
                  "text-error": currentStage === Stage.ZERO,
                  "text-warning": currentStage === Stage.ONE,
                  "text-success": currentStage === Stage.TWO,
                  "text-secondary":
                    currentStage === Stage.NONE ||
                    currentStage === Stage.UNKNOWN,
                },
              )}
            >
              {currentStage === Stage.NONE
                ? "NO STAGE"
                : `Stage ${stageToText(currentStage)}`}
            </span>
          </div>
          <BulletPoint className="text-middle-dark mb-1 hidden text-sm sm:block" />
          {/* Items to next stage */}
          <div className="flex justify-start">
            <Button
              variant="ghost"
              className="group px-0 py-0 font-mono"
              onClick={handleButtonClick}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
            >
              <span className="border-foreground text-alternative-sm border-b border-dashed font-medium duration-300 hover:border-white">
                {currentStage === Stage.NONE ? (
                  <span className="text-secondary group-hover:text-primary uppercase duration-300">
                    Does not qualify
                  </span>
                ) : (
                  <>
                    <span className="text-primary uppercase duration-300">
                      {currentStage !== Stage.UNKNOWN
                        ? formatPlural(
                            highRiskItems.length ||
                              mediumRiskItems.length ||
                              lowRiskItems.length,
                            "ITEM",
                          )
                        : "? ITEMS"}
                    </span>
                    <span
                      className={cn([
                        "text-secondary duration-300",
                        {
                          "group-hover:text-primary":
                            currentStage !== Stage.UNKNOWN,
                        },
                      ])}
                    >
                      {" "}
                      {currentStage !== Stage.UNKNOWN
                        ? `TO STAGE ${Number(currentStage) + 1}`
                        : "TO NEXT"}
                    </span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
        <div className="flex gap-1 p-2 pr-0 sm:gap-2">
          <OutlinedBox
            variant={"error"}
            disabled={
              currentStage === Stage.UNKNOWN || currentStage === Stage.NONE
            }
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">
              {currentStage !== Stage.UNKNOWN ? highRiskItems.length : "?"}
            </span>
          </OutlinedBox>
          <OutlinedBox
            variant="warning"
            disabled={
              currentStage === Stage.UNKNOWN || currentStage === Stage.NONE
            }
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">
              {currentStage !== Stage.UNKNOWN ? mediumRiskItems.length : "?"}
            </span>
          </OutlinedBox>
          <OutlinedBox
            variant="success"
            disabled={
              currentStage === Stage.UNKNOWN || currentStage === Stage.NONE
            }
            className="p-1 py-0.5"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">
              {currentStage !== Stage.UNKNOWN ? lowRiskItems.length : "?"}
            </span>
          </OutlinedBox>
        </div>
      </div>
      {showTooltip && currentStage !== Stage.UNKNOWN && (
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
