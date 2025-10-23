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
import { DaoAvatarIcon, PointerIcon } from "@/shared/components/icons";
import { Stage } from "@/shared/types/enums/Stage";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import { useCallback, useState } from "react";
import { useScreenSize } from "@/shared/hooks";
import { StageRequirementsTooltip } from "@/features/dao-overview/components/StageRequirementsTooltip";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";

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

export const StagesToBorderColor: Record<Stage, string> = {
  [Stage.ZERO]: "border-error",
  [Stage.ONE]: "border-warning",
  [Stage.TWO]: "border-success",
  [Stage.NONE]: "",
  [Stage.UNKNOWN]: "",
};

export const StagesToLineWidth: Record<Stage, string> = {
  [Stage.ZERO]: "27%",
  [Stage.ONE]: "72%",
  [Stage.TWO]: "100%",
  [Stage.NONE]: "0%",
  [Stage.UNKNOWN]: "0%",
};

export const StagesToLineColor: Record<Stage, string> = {
  [Stage.ZERO]: "bg-error",
  [Stage.ONE]: "bg-warning",
  [Stage.TWO]: "bg-success",
  [Stage.NONE]: "",
  [Stage.UNKNOWN]: "",
};

const CurrentDaoStageAvatar = ({
  daoId,
  currentDaoStage,
}: {
  daoId: DaoIdEnum;
  currentDaoStage: Stage;
}) => (
  <>
    <div
      className={cn(
        "flex size-7 items-center justify-center overflow-hidden rounded-full border-2 bg-white transition-all duration-300",
        StagesToBorderColor[currentDaoStage],
      )}
    >
      <DaoAvatarIcon daoId={daoId} className="rounded-none" />
    </div>
    <PointerIcon className="absolute -bottom-4 translate-y-px" />
  </>
);

export const StagesContainer = ({
  daoId,
  daoConfig,
  context,
  currentDaoStage,
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
    <div
      className={cn("flex h-full w-full flex-col gap-1", {
        "sm:bg-surface-default gap-4 md:p-4": context === "overview",
      })}
    >
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/resilience-stages`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          RESILIENCE STAGES
        </DefaultLink>
        <TooltipInfo text="Resilience Stages are based on governance mechanisms, considering the riskiest exposed vector as criteria for progression." />
      </div>
      <div className="flex flex-col gap-5">
        <div className={cn("flex flex-col")}>
          {/* Timeline Component */}
          <div
            className={
              "relative mb-4 flex h-7 w-full flex-col items-center justify-start"
            }
          >
            {/* Background Line */}
            <div className="bg-middle-dark absolute left-0 right-0 top-1/2 z-0 h-0.5 -translate-y-1/2" />

            {/* Horizontal Line */}
            <div
              className={cn(
                "absolute left-0 top-1/2 z-0 h-0.5 -translate-y-1/2 transition-all duration-500",
                StagesToLineColor[currentDaoStage],
              )}
              style={{ width: StagesToLineWidth[currentDaoStage] }}
            />

            <div className="z-10 flex h-full w-full items-center justify-between">
              {/* Stage 0 */}
              <div className="bg-surface-default">
                <StageTag
                  tagStage={Stage.ZERO}
                  daoStage={currentDaoStage}
                  showStageText
                />
              </div>

              {/* Space between Stage 0 and 1 */}
              <div className="flex flex-1 items-center justify-center">
                {currentDaoStage === Stage.ZERO && (
                  <CurrentDaoStageAvatar
                    daoId={daoId}
                    currentDaoStage={currentDaoStage}
                  />
                )}
              </div>

              {/* Stage 1 */}
              <div className="bg-surface-default">
                <StageTag
                  tagStage={Stage.ONE}
                  daoStage={currentDaoStage}
                  showStageText
                />
              </div>

              {/* Space between Stage 1 and 2 */}
              <div className="flex flex-1 items-center justify-center">
                {currentDaoStage === Stage.ONE && (
                  <CurrentDaoStageAvatar
                    daoId={daoId}
                    currentDaoStage={currentDaoStage}
                  />
                )}
              </div>

              {/* Stage 2 */}
              <div className="bg-surface-default">
                <StageTag
                  tagStage={Stage.TWO}
                  daoStage={currentDaoStage}
                  showStageText
                />
              </div>
              {currentDaoStage === Stage.TWO && (
                <div className="right-18 absolute top-1/2 -translate-y-1/2">
                  <CurrentDaoStageAvatar
                    daoId={daoId}
                    currentDaoStage={currentDaoStage}
                  />
                </div>
              )}
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
    </div>
  );
};
