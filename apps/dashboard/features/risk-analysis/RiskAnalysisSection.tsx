"use client";

import {
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
} from "@/shared/components/cards/RiskAreaCard";
import {
  RequirementMetric,
  RiskDescription,
} from "@/features/risk-analysis/components/RiskDescription";
import {
  RiskLevel,
  RiskAreaEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { RISK_AREAS } from "@/shared/constants/risk-areas";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import daoConfigByDaoId from "@/shared/dao-config";
import { ReactNode, useState } from "react";
import { GovernanceImplementationDrawer } from "@/features/risk-analysis/components/GovernanceImplementationDrawer";

interface RiskAreaDisplayItem {
  name: string;
  level: RiskLevel;
  content?: ReactNode;
}

export const RiskAnalysisSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [activeRisk, setActiveRisk] = useState<RiskAreaEnum | undefined>(
    RiskAreaEnum.SPAM_RESISTANCE,
  );
  const [selectedMetric, setSelectedMetric] =
    useState<RequirementMetric | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const daoRiskAreas = getDaoRiskAreas(daoId);

  const handleRiskClick = (riskName: RiskAreaEnum) => {
    setActiveRisk(riskName);
  };

  const handleMetricClick = (requirement: RequirementMetric) => {
    setSelectedMetric(requirement);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedMetric(null);
  };

  // Create risk areas array for the card display
  const riskAreasWithLevel: RiskAreaDisplayItem[] = Object.entries(
    daoRiskAreas,
  ).map(([name, info]) => ({
    name,
    level: info.riskLevel,
  }));

  // Customize the GOV INTERFACES VULNERABILITY for display
  const customizedRiskAreas = [...riskAreasWithLevel];
  const govIndex = customizedRiskAreas.findIndex(
    (risk) => risk.name === RiskAreaEnum.GOV_FRONTEND_RESILIENCE,
  );
  if (govIndex !== -1) {
    customizedRiskAreas[govIndex] = {
      ...customizedRiskAreas[govIndex],
      content: (
        <span className="line-height-[0] inline-flex flex-wrap align-baseline">
          <span className="inline-block">GOV FRONT-END VULNERABILITY</span>
        </span>
      ),
    };
  }

  // Get DAO configuration
  const daoConfig = daoConfigByDaoId[daoId];

  // Helper function to create requirements from attack exposure metrics
  const createRequirementsFromMetrics = (riskArea: RiskAreaEnum) => {
    // Get requirements from the consolidated RISK_AREAS object
    const govImplItems = RISK_AREAS[riskArea].requirements;

    // Map to requirements with data from governance implementation
    return govImplItems.map((metricEnum) => {
      const field = daoConfig.governanceImplementation?.fields?.[metricEnum];
      return {
        name: metricEnum,
        riskLevel: field?.riskLevel || RiskLevel.NONE,
        value: field?.value || "",
        description: field?.description || "",
      };
    });
  };

  // Generate risk descriptions using the RiskDescription component and the RISK_AREAS object
  const riskDescriptions: Record<string, ReactNode> = {};

  // Create risk descriptions for each risk area using the mapping
  Object.entries(RISK_AREAS).forEach(([riskAreaKey, riskAreaInfo]) => {
    const riskArea = riskAreaKey as RiskAreaEnum;

    // Get DAO-specific risk description from attackExposure
    const riskExposure =
      daoConfig.attackExposure?.defenseAreas?.[riskArea]?.description ||
      "Risk exposure data not available";

    riskDescriptions[riskArea] = (
      <RiskDescription
        title={riskAreaInfo.title}
        defenseDefinition={riskAreaInfo.description}
        riskExposure={riskExposure}
        requirements={createRequirementsFromMetrics(riskArea)}
        riskLevel={daoRiskAreas[riskArea]?.riskLevel}
        onMetricClick={handleMetricClick}
      />
    );
  });

  // Get metric data for drawer
  const metricEnum = selectedMetric?.name as GovernanceImplementationEnum;
  const selectedMetricData =
    selectedMetric &&
    metricEnum &&
    daoConfig.governanceImplementation?.fields?.[metricEnum]
      ? {
          name: selectedMetric.name,
          description:
            daoConfig.governanceImplementation.fields[metricEnum].description,
          riskLevel: selectedMetric.riskLevel,
          currentSetting:
            daoConfig.governanceImplementation.fields[metricEnum]
              .currentSetting,
          impact: daoConfig.governanceImplementation.fields[metricEnum].impact,
          recommendedSetting:
            daoConfig.governanceImplementation.fields[metricEnum]
              .recommendedSetting,
          nextStep:
            daoConfig.governanceImplementation.fields[metricEnum].nextStep,
        }
      : null;

  return (
    <>
      <div className="flex h-[calc(100vh-16rem)] flex-col gap-[13px] lg:flex-row">
        <div className="lg:w-2/5">
          <RiskAreaCardWrapper
            daoId={daoId}
            title="Attack Exposure"
            riskAreas={customizedRiskAreas}
            activeRiskId={activeRisk}
            onRiskClick={handleRiskClick}
            className="grid-cols-2 lg:grid-cols-1"
            variant={RiskAreaCardEnum.RISK_ANALYSIS}
            withTitle={false}
          />
        </div>

        <div className="lg:w-3/5">
          {activeRisk ? (
            riskDescriptions[activeRisk]
          ) : (
            <div className="border-light-dark bg-surface-default flex h-full items-center justify-center border p-5">
              <p className="text-secondary text-center">
                Select a risk area to view details
              </p>
            </div>
          )}
        </div>
      </div>

      <GovernanceImplementationDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        metricType={metricEnum}
        metricData={selectedMetricData}
      />
    </>
  );
};
