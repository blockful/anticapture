"use client";

import {
  Button,
  StagesCardRequirements,
  TooltipInfo,
} from "@/shared/components";
import { cn, formatPlural } from "@/shared/utils";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  filterFieldsByRiskLevel,
  getDaoStageFromFields,
  fieldsToArray,
} from "@/shared/dao-config/utils";
import { RiskLevel } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { StageTag } from "@/features/resilience-stages/components";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { Stage } from "@/shared/types/enums/Stage";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import { useScreenSize } from "@/shared/hooks";
import { useEffect, useState, useCallback } from "react";
import { StageRequirementsTooltip } from "@/features/dao-overview/components/StageRequirementsTooltip";
import { SubSectionsContainer } from "@/shared/components/design-system/section";

interface DaoOverviewResilienceStageProps {
  daoId: DaoIdEnum;
}

const STAGE_STYLES: Record<
  Stage,
  { line: string; border: string; position: string }
> = {
  [Stage.ZERO]: {
    line: "w-[25%] bg-error",
    border: "border-error",
    position: "right-[75%]",
  },
  [Stage.ONE]: {
    line: "w-[75%] bg-warning",
    border: "border-warning",
    position: "right-[25%]",
  },
  [Stage.TWO]: {
    line: "w-full bg-success",
    border: "border-success",
    position: "right-0 hidden",
  },
  [Stage.NONE]: { line: "", border: "", position: "" },
  [Stage.UNKNOWN]: { line: "", border: "", position: "" },
};

export const DaoOverviewResilienceStage = ({
  daoId,
}: DaoOverviewResilienceStageProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { isMobile } = useScreenSize();
  const daoConfig = daoConfigByDaoId[daoId];

  const allFields = fieldsToArray(daoConfig.governanceImplementation?.fields);
  const currentDaoStage = getDaoStageFromFields({
    fields: allFields,
    noStage: daoConfig.noStage,
  });

  const riskItems = {
    high: filterFieldsByRiskLevel(allFields, RiskLevel.HIGH),
    medium: filterFieldsByRiskLevel(allFields, RiskLevel.MEDIUM),
    low: filterFieldsByRiskLevel(allFields, RiskLevel.LOW),
  };

  const requirements =
    riskItems.high.length > 0
      ? riskItems.high.map((i) => i.name)
      : riskItems.medium.length > 0
        ? riskItems.medium.map((i) => i.name)
        : [];

  const styles = STAGE_STYLES[currentDaoStage];
  const isStageKnown = ![Stage.UNKNOWN, Stage.NONE].includes(currentDaoStage);

  useEffect(() => {
    const handleClick = () => setShowTooltip(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleButtonClick = useCallback(() => {
    if (isMobile) {
      setShowTooltip((prev) => !prev);
    } else {
      const section = document.getElementById(
        PAGES_CONSTANTS.resilienceStages.page,
      );
      section?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isMobile]);

  const renderTimeline = () => (
    <div className="bg-middle-dark relative h-0.5 w-full">
      {/* Progress line */}
      <div className={cn("absolute left-0 h-0.5", styles.line)} />

      {/* Stage 0 */}
      <div className="bg-surface-default absolute left-0 top-1/2 -translate-y-1/2">
        <StageTag
          showStageText
          tagStage={Stage.ZERO}
          daoStage={currentDaoStage}
        />
      </div>

      {/* Stage 1 */}
      <div className="bg-surface-default absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <StageTag
          showStageText
          tagStage={Stage.ONE}
          daoStage={currentDaoStage}
        />
      </div>

      {/* Current position indicator */}
      {isStageKnown && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 translate-x-1/2",
            styles.position,
          )}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-7 items-center justify-center overflow-hidden border-2 bg-white",
                styles.border,
              )}
            >
              <DaoAvatarIcon
                daoId={daoId}
                className="size-7 flex-shrink-0 rounded-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage 2 */}
      <div className="bg-surface-default absolute right-0 top-1/2 -translate-y-1/2">
        <StageTag
          showStageText
          tagStage={Stage.TWO}
          daoStage={currentDaoStage}
        />
      </div>
    </div>
  );

  const renderRiskBoxes = () => {
    const boxConfigs = [
      { variant: "error", count: riskItems.high.length },
      { variant: "warning", count: riskItems.medium.length },
      { variant: "success", count: riskItems.low.length },
    ] as const;

    return (
      <div className="flex gap-1.5">
        {boxConfigs.map(({ variant, count }) => (
          <OutlinedBox
            key={variant}
            variant={variant}
            disabled={!isStageKnown}
            className="border-0 px-2 py-1"
            onClick={() => setShowTooltip((prev) => !prev)}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
          >
            <span className="font-mono">{isStageKnown ? count : "?"}</span>
          </OutlinedBox>
        ))}
      </div>
    );
  };

  return (
    <SubSectionsContainer className="max-w-[462px] md:p-4">
      <div className="flex h-full items-center gap-2">
        <p className="text-primary border-foreground border-b border-dashed font-mono text-[13px] font-medium tracking-wider">
          RESILIENCE STAGE
        </p>
        <TooltipInfo text="Resilience Stages are based on governance mechanisms, considering the riskiest exposed vector as criteria for progression." />
      </div>

      <div className="flex h-7 w-full flex-col items-center justify-start">
        {renderTimeline()}
      </div>

      <div className="relative">
        <StagesCardRequirements
          daoStage={currentDaoStage}
          context="dao-overview"
          className="border-border-contrast border-b-1 rounded-none p-3"
        />

        <div
          className="border-light-dark bg-surface-contrast flex items-center justify-between gap-1 border-b p-2 sm:border-none sm:p-3"
          onMouseLeave={() => !isMobile && setShowTooltip(false)}
        >
          <div className="flex flex-col justify-start gap-1 px-1 sm:flex-row sm:items-center">
            <div className="flex justify-start">
              <Button
                variant="ghost"
                className="group px-0 py-0 font-mono"
                onClick={handleButtonClick}
                onMouseEnter={() => !isMobile && setShowTooltip(true)}
              >
                <span className="border-foreground text-alternative-sm text-nowrap border-b border-dashed font-medium duration-300 hover:border-white">
                  {currentDaoStage === Stage.NONE ? (
                    <span className="text-secondary group-hover:text-primary uppercase duration-300">
                      Does not qualify
                    </span>
                  ) : (
                    <>
                      <span className="text-primary uppercase duration-300">
                        {currentDaoStage !== Stage.UNKNOWN
                          ? formatPlural(
                              riskItems.high.length ||
                                riskItems.medium.length ||
                                riskItems.low.length,
                              "ITEM",
                            )
                          : "? ITEMS"}
                      </span>
                      <span
                        className={cn(
                          "text-secondary duration-300",
                          isStageKnown && "group-hover:text-primary",
                        )}
                      >
                        {" "}
                        {isStageKnown
                          ? `TO STAGE ${Number(currentDaoStage) + 1}`
                          : "TO NEXT"}
                      </span>
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>

          {renderRiskBoxes()}
        </div>

        {showTooltip && isStageKnown && (
          <StageRequirementsTooltip
            currentStage={currentDaoStage}
            nextStage={Number(currentDaoStage) + 1}
            requirements={requirements}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
            onMouseLeave={() => !isMobile && setShowTooltip(false)}
          />
        )}
      </div>
    </SubSectionsContainer>
  );
};
