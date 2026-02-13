"use client";

import { useState, useCallback } from "react";
import { TheSectionLayout } from "@/shared/components";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  getDaoStageFromFields,
  fieldsToArray,
  filterFieldsByRiskLevel,
} from "@/shared/dao-config/utils";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { Stage } from "@/shared/types/enums/Stage";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { BarChart } from "lucide-react";
import { stageToRiskMapping } from "@/features/resilience-stages/components/StagesContainer";
import { StagesCard } from "@/features/resilience-stages/components/StagesCard";
import { PendingCriteriaCard } from "@/features/resilience-stages/components/PendingCriteriaCard";
import { FrameworkOverviewCard } from "@/features/resilience-stages/components/FrameworkOverviewCard";
import { GovernanceImplementationDrawer } from "@/features/risk-analysis/components/GovernanceImplementationDrawer";

interface ResilienceStagesSectionProps {
  daoId: DaoIdEnum;
}

export const ResilienceStagesSection = ({
  daoId,
}: ResilienceStagesSectionProps) => {
  const daoConfig = daoConfigByDaoId[daoId];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<
    (GovernanceImplementationField & { name: string }) | null
  >(null);

  const allFields = fieldsToArray(daoConfig.governanceImplementation?.fields);

  const currentDaoStage = getDaoStageFromFields({
    fields: allFields,
    noStage: daoConfig.noStage,
  });

  const highRiskFields = filterFieldsByRiskLevel(allFields, RiskLevel.HIGH);
  const mediumRiskFields = filterFieldsByRiskLevel(allFields, RiskLevel.MEDIUM);
  const lowRiskFields = filterFieldsByRiskLevel(allFields, RiskLevel.LOW);

  // Pending fields are the ones blocking progression to the next stage
  const pendingFields =
    currentDaoStage === Stage.ZERO
      ? highRiskFields
      : currentDaoStage === Stage.ONE
        ? mediumRiskFields
        : [];

  const handleMetricClick = useCallback(
    (field: GovernanceImplementationField & { name: string }) => {
      setSelectedMetric(field);
      setIsDrawerOpen(true);
    },
    [],
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedMetric(null);
  }, []);

  const metricEnum =
    selectedMetric?.name as GovernanceImplementationEnum | null;

  return (
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.resilienceStages.title}
        icon={<BarChart className="section-layout-icon" />}
        description={PAGES_CONSTANTS.resilienceStages.description}
      >
        <div className="flex flex-col gap-2">
          {/* Stages horizontal bar */}
          <div className="flex flex-col">
            {(currentDaoStage === Stage.NONE ||
              currentDaoStage === Stage.UNKNOWN) && (
              <div className="bg-surface-contrast flex items-center px-4 py-2.5">
                <p className="font-mono text-[13px] font-medium uppercase tracking-wider">
                  <span className="text-secondary">[no stage]</span>{" "}
                  <span className="text-primary">
                    DAO not yet eligible for staging
                  </span>
                </p>
              </div>
            )}
            <StagesCard currentDaoStage={currentDaoStage} />
          </div>

          {/* Two-column content */}
          <div className="flex flex-col gap-2 lg:flex-row">
            <PendingCriteriaCard
              pendingFields={pendingFields}
              currentDaoStage={currentDaoStage}
              onMetricClick={handleMetricClick}
            />
            <FrameworkOverviewCard
              highRiskFields={highRiskFields}
              mediumRiskFields={mediumRiskFields}
              lowRiskFields={lowRiskFields}
              onMetricClick={handleMetricClick}
            />
          </div>
        </div>
      </TheSectionLayout>

      <GovernanceImplementationDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        metricType={metricEnum}
        metricData={selectedMetric}
      />
    </div>
  );
};
