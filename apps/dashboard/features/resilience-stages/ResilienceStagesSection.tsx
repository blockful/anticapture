"use client";

import { RiskLevelCard, TheSectionLayout } from "@/shared/components";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  getDaoStageFromFields,
  fieldsToArray,
  filterFieldsByRiskLevel,
} from "@/shared/dao-config/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskLevel } from "@/shared/types/enums";
import { Stage } from "@/shared/types/enums/Stage";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { BarChart } from "lucide-react";
import { stageToRiskMapping } from "@/features/resilience-stages/components/StagesContainer";
import { StagesCard } from "@/features/resilience-stages/components/StagesCard";
import { PendingCriteriaCard } from "@/features/resilience-stages/components/PendingCriteriaCard";
import { FrameworkOverviewCard } from "@/features/resilience-stages/components/FrameworkOverviewCard";

interface ResilienceStagesSectionProps {
  daoId: DaoIdEnum;
}

export const ResilienceStagesSection = ({
  daoId,
}: ResilienceStagesSectionProps) => {
  const daoConfig = daoConfigByDaoId[daoId];

  const allFields = fieldsToArray(
    daoConfig.governanceImplementation?.fields,
  );

  const currentDaoStage = getDaoStageFromFields({
    fields: allFields,
    noStage: daoConfig.noStage,
  });

  const highRiskFields = filterFieldsByRiskLevel(allFields, RiskLevel.HIGH);
  const mediumRiskFields = filterFieldsByRiskLevel(
    allFields,
    RiskLevel.MEDIUM,
  );
  const lowRiskFields = filterFieldsByRiskLevel(allFields, RiskLevel.LOW);

  // Pending fields are the ones blocking progression to the next stage
  const pendingFields =
    currentDaoStage === Stage.ZERO
      ? highRiskFields
      : currentDaoStage === Stage.ONE
        ? mediumRiskFields
        : [];

  return (
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.resilienceStages.title}
        riskLevel={
          <RiskLevelCard status={stageToRiskMapping[currentDaoStage]} />
        }
        icon={<BarChart className="section-layout-icon" />}
        description={PAGES_CONSTANTS.resilienceStages.description}
      >
        <div className="flex flex-col gap-2">
          {/* Stages horizontal bar */}
          <StagesCard currentDaoStage={currentDaoStage} />

          {/* Two-column content */}
          <div className="flex flex-col gap-2 lg:flex-row">
            <PendingCriteriaCard
              pendingFields={pendingFields}
              currentDaoStage={currentDaoStage}
            />
            <FrameworkOverviewCard
              highRiskFields={highRiskFields}
              mediumRiskFields={mediumRiskFields}
              lowRiskFields={lowRiskFields}
            />
          </div>
        </div>
      </TheSectionLayout>
    </div>
  );
};
