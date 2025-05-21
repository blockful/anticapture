"use client";

import {
  TheSectionLayout,
  RiskLevelCard,
  StagesCardRequirements,
} from "@/shared/components";
import { cn } from "@/shared/utils/";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  filterFieldsByRiskLevel,
  getDaoStageFromFields,
  fieldsToArray,
} from "@/shared/dao-config/utils";
import { RiskLevel } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { BarChart } from "lucide-react";
import {
  StageAccordion,
  StageTag,
} from "@/features/resilience-stages/components";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { Stage } from "@/shared/types/enums/Stage";
interface ResilienceStagesSectionProps {
  daoId: DaoIdEnum;
}

export const ResilienceStagesSection = ({
  daoId,
}: ResilienceStagesSectionProps) => {
  const daoConfig = daoConfigByDaoId[daoId];

  const currentDaoStage = getDaoStageFromFields(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
  );

  const stageToRiskMapping: Record<Stage, RiskLevel> = {
    [Stage.ZERO]: RiskLevel.HIGH,
    [Stage.ONE]: RiskLevel.MEDIUM,
    [Stage.TWO]: RiskLevel.LOW,
    [Stage.NONE]: RiskLevel.NONE,
  };

  const highRiskItems = filterFieldsByRiskLevel(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
    stageToRiskMapping[currentDaoStage],
  );

  const mediumRiskItems = filterFieldsByRiskLevel(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
    RiskLevel.MEDIUM,
  );

  const issues =
    highRiskItems.length > 0
      ? highRiskItems.map((item) => item.name)
      : mediumRiskItems.length > 0
        ? mediumRiskItems.map((item) => item.name)
        : undefined;

  const StagesToDaoAvatarPosition: Record<Stage, string> = {
    [Stage.ZERO]: "right-[75%]",
    [Stage.ONE]: "right-[25%]",
    [Stage.TWO]: "right-0 hidden",
    [Stage.NONE]: "",
  };

  const StagesToLineStyle: Record<Stage, string> = {
    [Stage.ZERO]: "w-[25%] bg-error",
    [Stage.ONE]: "w-[75%] bg-warning",
    [Stage.TWO]: "w-full bg-success",
    [Stage.NONE]: "",
  };

  const StagesToBorderColor: Record<Stage, string> = {
    [Stage.ZERO]: "border-error",
    [Stage.ONE]: "border-warning",
    [Stage.TWO]: "border-success",
    [Stage.NONE]: "",
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.resilienceStages.title}
      riskLevel={<RiskLevelCard status={stageToRiskMapping[currentDaoStage]} />}
      icon={<BarChart className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.resilienceStages.description}
      anchorId={SECTIONS_CONSTANTS.resilienceStages.anchorId}
    >
      <div className="flex h-7 w-full items-center justify-center">
        {/* Timeline Component */}
        <div className="bg-middle-dark relative h-0.5 w-full">
          {/* Horizontal Line */}
          <div
            className={cn(
              "absolute left-0 h-0.5",
              StagesToLineStyle[currentDaoStage],
            )}
          ></div>

          {/* Stage 0 */}
          <div className="bg-dark absolute top-1/2 left-0 -translate-y-1/2">
            <StageTag tagStage={Stage.ZERO} daoStage={currentDaoStage} />
          </div>

          {/* Stage 1 */}
          <div className="bg-dark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <StageTag tagStage={Stage.ONE} daoStage={currentDaoStage} />
          </div>

          {/* Current Position Indicator */}
          <div
            className={cn(
              "absolute top-1/2 translate-x-1/2 -translate-y-1/2",
              StagesToDaoAvatarPosition[currentDaoStage],
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center overflow-hidden rounded-full border-2 bg-white",
                StagesToBorderColor[currentDaoStage],
              )}
            >
              <DaoAvatarIcon isRounded daoId={daoId} />
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-dark absolute top-1/2 right-0 -translate-y-1/2">
            <StageTag tagStage={Stage.TWO} daoStage={currentDaoStage} />
          </div>
        </div>
      </div>

      <StagesCardRequirements issues={issues} daoStage={currentDaoStage} />

      <StageAccordion
        daoStage={currentDaoStage}
        highRiskFields={highRiskItems}
        mediumRiskFields={mediumRiskItems}
      />
    </TheSectionLayout>
  );
};
