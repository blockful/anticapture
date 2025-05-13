"use client";

import { Gauge } from "lucide-react";
import { TheSectionLayout, RiskLevelCard } from "@/components/atoms";
import {
  RiskAreaCardWrapper,
  RiskAreaCardEnum,
} from "@/components/molecules/RiskAreaCard";
import { RiskDescription } from "@/components/molecules/RiskDescription";
import {
  RiskLevel,
  RiskAreaEnum,
  GovernanceImplementationEnum,
} from "@/lib/enums";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/types/daos";
import { useDaoPageInteraction } from "@/contexts/DaoPageInteractionContext";
import { RISK_AREAS } from "@/lib/constants/risk-areas";
import { getDaoRiskAreas } from "@/lib/utils/risk-analysis";
import { fieldsToArray } from "@/lib/dao-config/utils";
import daoConfigByDaoId from "@/lib/dao-config";
import { GovernanceImplementationField } from "@/lib/dao-config/types";

// Define type for the risk area display items
interface RiskAreaDisplayItem {
  name: string;
  level: RiskLevel;
  content?: React.ReactNode;
}

export const RiskAnalysisSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { activeRisk, setActiveRisk } = useDaoPageInteraction();

  const daoRiskAreas = getDaoRiskAreas(daoId);

  const handleRiskClick = (riskName: RiskAreaEnum) => {
    setActiveRisk(riskName);
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
    (risk) => risk.name === RiskAreaEnum.GOV_INTERFACES_VULNERABILITY,
  );
  if (govIndex !== -1) {
    customizedRiskAreas[govIndex] = {
      ...customizedRiskAreas[govIndex],
      content: (
        <span className="line-height-[0] inline-flex flex-wrap align-baseline">
          <span className="inline-block">GOV INTERF</span>
          <span className="hidden sm:inline-block">ACES</span>
          <span className="inline-block sm:hidden">.</span>
          <span className="inline-block">&nbsp;VULNERABILITY</span>
        </span>
      ),
    };
  }

  // Helper function to create requirements from governance implementation items
  const createRequirementsFromGovImplItems = (
    riskArea: RiskAreaEnum,
  ): (GovernanceImplementationField & { name: string })[] => {
    // Get requirements from the consolidated RISK_AREAS object
    const govImplItems = RISK_AREAS[riskArea].requirements;
    return fieldsToArray(
      daoConfigByDaoId[daoId].governanceImplementation?.fields || {},
    ).filter((field) => {
      return govImplItems.includes(field.name as GovernanceImplementationEnum);
    });
  };

  // Generate risk descriptions using the RiskDescription component and the RISK_AREAS object
  const riskDescriptions: Record<string, React.ReactNode> = {};

  // Create risk descriptions for each risk area using the mapping
  Object.entries(RISK_AREAS).forEach(([riskAreaKey, riskAreaInfo]) => {
    const riskArea = riskAreaKey as RiskAreaEnum;
    const specialDescriptionForSpam =
      riskArea === RiskAreaEnum.SPAM_VULNERABLE
        ? [
            "Means the system can be overwhelmed by malicious or low-quality proposals. This wastes resources, discourages real participation and exposes the DAO to a war of attrition.",
            "It usually happens when there's no checks to submit proposals, or the implementation allows it to be ignored.",
          ]
        : riskAreaInfo.description;

    riskDescriptions[riskArea] = (
      <RiskDescription
        title={riskAreaInfo.title}
        description={specialDescriptionForSpam}
        requirements={createRequirementsFromGovImplItems(riskArea)}
        riskLevel={daoRiskAreas[riskArea]?.riskLevel}
      />
    );
  });

  // Determine the highest risk level for the section header
  const getHighestRiskLevel = (): RiskLevel => {
    for (const riskAreaInfo of Object.values(daoRiskAreas)) {
      if (riskAreaInfo.riskLevel === RiskLevel.HIGH) {
        return RiskLevel.HIGH;
      }
    }

    for (const riskAreaInfo of Object.values(daoRiskAreas)) {
      if (riskAreaInfo.riskLevel === RiskLevel.MEDIUM) {
        return RiskLevel.MEDIUM;
      }
    }

    return RiskLevel.LOW;
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.riskAnalysis.title}
      icon={<Gauge className="size-6 text-foreground" />}
      description={SECTIONS_CONSTANTS.riskAnalysis.description}
      anchorId={SECTIONS_CONSTANTS.riskAnalysis.anchorId}
      riskLevel={<RiskLevelCard status={getHighestRiskLevel()} />}
    >
      <div className="flex flex-col gap-[13px] md:flex-row">
        <div className="md:w-2/5">
          <RiskAreaCardWrapper
            title="Risk Areas"
            riskAreas={customizedRiskAreas}
            activeRiskId={activeRisk}
            onRiskClick={handleRiskClick}
            className="grid-cols-2 sm:grid-cols-1"
            variant={RiskAreaCardEnum.RISK_ANALYSIS}
            withTitle={false}
          />
        </div>

        <div className="md:w-3/5">
          {activeRisk ? (
            riskDescriptions[activeRisk]
          ) : (
            <div className="flex h-full items-center justify-center border border-lightDark bg-dark p-5">
              <p className="text-center text-foreground">
                Select a risk area to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </TheSectionLayout>
  );
};
