"use client";

import { RiskLevelCard, TheSectionLayout } from "@/shared/components";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  getDaoStageFromFields,
  fieldsToArray,
} from "@/shared/dao-config/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { BarChart } from "lucide-react";
import {
  StagesContainer,
  stageToRiskMapping,
} from "@/features/resilience-stages/components/StagesContainer";
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

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.resilienceStages.title}
      riskLevel={<RiskLevelCard status={stageToRiskMapping[currentDaoStage]} />}
      icon={<BarChart className="section-layout-icon" />}
      description={PAGES_CONSTANTS.resilienceStages.description}
    >
      <StagesContainer
        daoId={daoId}
        currentDaoStage={currentDaoStage}
        daoConfig={daoConfig}
        context="section"
      />
    </TheSectionLayout>
  );
};
