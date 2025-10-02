"use client";

import {
  RiskLevelCard,
  StagesCardRequirements,
  TheSectionLayout,
} from "@/shared/components";
import { cn } from "@/shared/utils/";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  filterFieldsByRiskLevel,
  getDaoStageFromFields,
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
import {
  SubSectionsContainer,
  SubSection,
} from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { BarChart } from "lucide-react";
interface ResilienceStagesSectionProps {
  daoId: DaoIdEnum;
}

export const ResilienceStagesSection = ({
  daoId,
}: ResilienceStagesSectionProps) => {
  const daoConfig = daoConfigByDaoId[daoId];

  const currentDaoStage = getDaoStageFromFields({
    fields: fieldsToArray(daoConfig.governanceImplementation?.fields),
    noStage: daoConfig.noStage,
  });

  const stageToRiskMapping: Record<Stage, RiskLevel> = {
    [Stage.ZERO]: RiskLevel.HIGH,
    [Stage.ONE]: RiskLevel.MEDIUM,
    [Stage.TWO]: RiskLevel.LOW,
    [Stage.NONE]: RiskLevel.NONE,
    [Stage.UNKNOWN]: RiskLevel.NONE,
  };

  const highRiskItems = filterFieldsByRiskLevel(
    fieldsToArray(daoConfig.governanceImplementation?.fields),
    RiskLevel.HIGH,
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
    [Stage.UNKNOWN]: "",
  };

  const StagesToLineStyle: Record<Stage, string> = {
    [Stage.ZERO]: "w-[25%] bg-error",
    [Stage.ONE]: "w-[75%] bg-warning",
    [Stage.TWO]: "w-full bg-success",
    [Stage.NONE]: "",
    [Stage.UNKNOWN]: "",
  };

  const StagesToBorderColor: Record<Stage, string> = {
    [Stage.ZERO]: "border-error",
    [Stage.ONE]: "border-warning",
    [Stage.TWO]: "border-success",
    [Stage.NONE]: "",
    [Stage.UNKNOWN]: "",
  };

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.resilienceStages.title}
      riskLevel={<RiskLevelCard status={stageToRiskMapping[currentDaoStage]} />}
      icon={<BarChart className="section-layout-icon" />}
      description={PAGES_CONSTANTS.resilienceStages.description}
    >
      <SubSectionsContainer>
        <SubSection dateRange="" subsectionTitle="">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex h-7 w-full flex-col items-center justify-start">
                {/* Timeline Component */}
                <div className="bg-middle-dark relative h-0.5 w-full">
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
                    />
                  </div>

                  {/* Stage 1 */}
                  <div className="bg-surface-default absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <StageTag tagStage={Stage.ONE} daoStage={currentDaoStage} />
                  </div>

                  {/* Current Position Indicator */}
                  {currentDaoStage !== Stage.NONE && (
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 translate-x-1/2",
                        StagesToDaoAvatarPosition[currentDaoStage],
                      )}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center overflow-hidden rounded-full border-2 bg-white",
                            StagesToBorderColor[currentDaoStage],
                          )}
                        >
                          <DaoAvatarIcon isRounded daoId={daoId} />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Stage 2 */}
                  <div className="bg-surface-default absolute right-0 top-1/2 -translate-y-1/2">
                    <StageTag tagStage={Stage.TWO} daoStage={currentDaoStage} />
                  </div>
                </div>
              </div>
              <StagesCardRequirements
                issues={issues}
                daoStage={currentDaoStage}
              />
            </div>
            <StageAccordion
              daoStage={currentDaoStage}
              highRiskFields={highRiskItems}
              mediumRiskFields={mediumRiskItems}
            />
          </div>
        </SubSection>
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
