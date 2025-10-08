"use client";

import {
  Button,
  StagesCardRequirements,
  TooltipInfo,
} from "@/shared/components";
import { cn, formatPlural } from "@/shared/utils/";
import {
  filterFieldsByRiskLevel,
  fieldsToArray,
} from "@/shared/dao-config/utils";
import { RiskLevel } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  StageAccordion,
  StageTag,
} from "@/features/resilience-stages/components";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { Stage } from "@/shared/types/enums/Stage";
import { DaoConfiguration } from "@/shared/dao-config/types";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import { useCallback, useState } from "react";
import { useScreenSize } from "@/shared/hooks";
import { StageRequirementsTooltip } from "@/features/dao-overview/components/StageRequirementsTooltip";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

interface StagesContainerProps {
  daoId: DaoIdEnum;
  daoConfig: DaoConfiguration;
  currentDaoStage: Stage;
  context?: "overview" | "section";
}

export const stageToRiskMapping: Record<Stage, RiskLevel> = {
  [Stage.ZERO]: RiskLevel.HIGH,
  [Stage.ONE]: RiskLevel.MEDIUM,
  [Stage.TWO]: RiskLevel.LOW,
  [Stage.NONE]: RiskLevel.NONE,
  [Stage.UNKNOWN]: RiskLevel.NONE,
};

export const StagesToDaoAvatarPosition: Record<Stage, string> = {
  [Stage.ZERO]: "left-[25%]",
  [Stage.ONE]: "left-[75%]",
  [Stage.TWO]: "left-[100%]",
  [Stage.NONE]: "",
  [Stage.UNKNOWN]: "",
};
export const StagesToLineStyle: Record<Stage, string> = {
  [Stage.ZERO]: "w-[25%] bg-error",
  [Stage.ONE]: "w-[75%] bg-warning",
  [Stage.TWO]: "w-full bg-success",
  [Stage.NONE]: "",
  [Stage.UNKNOWN]: "",
};

export const StagesToBorderColor: Record<Stage, string> = {
  [Stage.ZERO]: "border-error",
  [Stage.ONE]: "border-warning",
  [Stage.TWO]: "border-success",
  [Stage.NONE]: "",
  [Stage.UNKNOWN]: "",
};

export const StagesContainer = ({
  daoId,
  daoConfig,
  currentDaoStage,
  context,
}: StagesContainerProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { isMobile } = useScreenSize();
  const isStageKnown = ![Stage.UNKNOWN, Stage.NONE].includes(currentDaoStage);

  const highRiskItems = filterFieldsByRiskLevel(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
    RiskLevel.HIGH,
  );

  const mediumRiskItems = filterFieldsByRiskLevel(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
    RiskLevel.MEDIUM,
  );

  const lowRiskItems = filterFieldsByRiskLevel(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
    RiskLevel.LOW,
  );

  const issues =
    highRiskItems.length > 0
      ? highRiskItems.map((item) => item.name)
      : mediumRiskItems.length > 0
        ? mediumRiskItems.map((item) => item.name)
        : undefined;

  const requirements =
    highRiskItems.length > 0
      ? highRiskItems.map((i) => i.name)
      : mediumRiskItems.length > 0
        ? mediumRiskItems.map((i) => i.name)
        : [];

  const boxConfigs = [
    { variant: "error", count: highRiskItems.length },
    { variant: "warning", count: mediumRiskItems.length },
    { variant: "success", count: lowRiskItems.length },
  ] as const;

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

  return (
    <SubSectionsContainer className="sm:p-4">
      <SubSection
        dateRange=""
        subsectionTitle={
          context === "overview" && (
            <div className="flex h-full items-center gap-2">
              <p className="text-primary border-foreground border-b border-dashed font-mono text-[13px] font-medium tracking-wider">
                RESILIENCE STAGE
              </p>
              <TooltipInfo text="Resilience Stages are based on governance mechanisms, considering the riskiest exposed vector as criteria for progression." />
            </div>
          )
        }
      >
        <div className="flex flex-col gap-5">
          <div
            className={cn("flex flex-col", {
              "gap-3": context !== "overview",
            })}
          >
            <div className="flex h-7 w-full flex-col items-center justify-start">
              {/* Timeline Component */}
              <div className="bg-middle-dark relative flex h-0.5 w-full items-center">
                {/* Horizontal Line */}
                <div
                  className={cn(
                    "absolute left-0 h-0.5",
                    StagesToLineStyle[currentDaoStage],
                  )}
                />

                {/* Stage 0 */}
                <div className="bg-surface-default absolute left-0 top-1/2 -translate-y-1/2">
                  <StageTag
                    tagStage={Stage.ZERO}
                    daoStage={currentDaoStage}
                    showStageText
                  />
                </div>

                {/* Stage 1 */}
                <div className="bg-surface-default absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <StageTag
                    tagStage={Stage.ONE}
                    daoStage={currentDaoStage}
                    showStageText
                  />
                </div>

                {/* Current Position Indicator */}
                {currentDaoStage !== Stage.NONE && (
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2",
                      StagesToDaoAvatarPosition[currentDaoStage],
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center overflow-hidden border-2 bg-white",
                          StagesToBorderColor[currentDaoStage],
                        )}
                      >
                        <DaoAvatarIcon daoId={daoId} className="rounded-none" />
                      </div>
                    </div>
                  </div>
                )}
                {/* Stage 2 */}
                <div className="bg-surface-default absolute right-0 top-1/2 -translate-y-1/2">
                  <StageTag
                    tagStage={Stage.TWO}
                    daoStage={currentDaoStage}
                    showStageText
                  />
                </div>
              </div>
            </div>
            <StagesCardRequirements
              issues={issues}
              daoStage={currentDaoStage}
              context={context}
              className={cn({
                "border-border-contrast border-b-1 rounded-none p-3":
                  context === "overview",
              })}
            />
            {context === "overview" && (
              <div
                className="border-light-dark bg-surface-contrast relative flex items-center justify-between gap-1 border-b p-2 sm:border-none sm:p-3"
                onMouseLeave={() => !isMobile && setShowTooltip(false)}
              >
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
                                highRiskItems.length ||
                                  mediumRiskItems.length ||
                                  lowRiskItems.length,
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
                      <span className="font-mono">
                        {isStageKnown ? count : "?"}
                      </span>
                    </OutlinedBox>
                  ))}
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
            )}
          </div>
          {context === "section" && (
            <StageAccordion
              daoStage={currentDaoStage}
              highRiskFields={highRiskItems}
              mediumRiskFields={mediumRiskItems}
            />
          )}
        </div>
      </SubSection>
    </SubSectionsContainer>
  );
};
