"use client";

import { useState, useEffect } from "react";
import { Gauge, ShieldAlert } from "lucide-react";
import { TheSectionLayout, RiskLevelCard } from "@/components/atoms";
import {
  RiskAreaCard,
  RiskAreaCardWrapper,
  RiskArea,
} from "@/components/molecules/RiskAreaCard";
import {
  RiskDescription,
  Requirement,
} from "@/components/molecules/RiskDescription";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/types/daos";
import { useDaoPageInteraction } from "@/contexts/DaoPageInteractionContext";
import { MOCKED_RISK_AREAS_WITH_RISK, RISK_AREAS } from "@/lib/constants/risk-areas";

export const RiskAnalysisSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [activeRisk, setActiveRisk] = useState<string | undefined>(undefined);
  const { activeRisk: contextActiveRisk, setActiveRisk: setContextActiveRisk } = useDaoPageInteraction();

  // Sync the local state with the context
  useEffect(() => {
    if (contextActiveRisk && contextActiveRisk !== activeRisk) {
      setActiveRisk(contextActiveRisk);
    }
  }, [contextActiveRisk, activeRisk]);

  const handleRiskClick = (riskName: string) => {
    const newActiveRisk = activeRisk === riskName ? undefined : riskName;
    setActiveRisk(newActiveRisk);
    if (newActiveRisk) {
      setContextActiveRisk(newActiveRisk);
    }
  };

  // Customize the GOV INTERFACES VULNERABILITY for display
  const customizedRiskAreas = [...MOCKED_RISK_AREAS_WITH_RISK];
  const govIndex = customizedRiskAreas.findIndex(risk => risk.name === "GOV INTERFACES VULNERABILITY");
  if (govIndex !== -1) {
    customizedRiskAreas[govIndex] = {
      ...customizedRiskAreas[govIndex],
      content: (
        <span className="inline-flex flex-wrap align-baseline line-height-[0]">
          <span className="inline-block">GOV INTERF</span>
          <span className="hidden sm:inline-block">ACES</span>
          <span className="inline-block sm:hidden">.&nbsp;</span>
          <span className="inline-block"> VULNERABILITY</span>
        </span>
      ),
    };
  }

  // Define the spam vulnerable requirements
  const spamVulnerableRequirements: Requirement[] = [
    { text: "Spam resistance" },
    { text: "Flash loan protection" },
    { text: "Proposal threshold" },
    { text: "Cancel function" },
    { text: "Voting period" },
    { text: "Voting subsidy" },
  ];

  // Helper function to get risk level by name
  const getRiskLevelByName = (name: string): RiskLevel | undefined => {
    const area = customizedRiskAreas.find((area) => area.name === name);
    return area?.level;
  };

  // Risk area descriptions using the RiskDescription component
  const riskDescriptions: Record<string, React.ReactNode> = {
    "SPAM VULNERABLE": (
      <RiskDescription
        title={RISK_AREAS["SPAM VULNERABLE"].title}
        description={[
          "Means the system can be overwhelmed by malicious or low-quality proposals. This wastes resources, discourages real participation and exposes the DAO to a war of attrition.",
          "It usually happens when there's no checks to submit proposals, or the implementation allows it to be ignored.",
        ]}
        requirements={spamVulnerableRequirements}
        riskLevel={getRiskLevelByName("SPAM VULNERABLE")}
      />
    ),
    "EXTRACTABLE VALUE": (
      <RiskDescription
        title={RISK_AREAS["EXTRACTABLE VALUE"].title}
        description={RISK_AREAS["EXTRACTABLE VALUE"].description}
        requirements={[]}
        riskLevel={getRiskLevelByName("EXTRACTABLE VALUE")}
      />
    ),
    "SAFEGUARDS": (
      <RiskDescription
        title={RISK_AREAS["SAFEGUARDS"].title}
        description={RISK_AREAS["SAFEGUARDS"].description}
        requirements={[]}
        riskLevel={getRiskLevelByName("SAFEGUARDS")}
      />
    ),
    "HACKABLE": (
      <RiskDescription
        title={RISK_AREAS["HACKABLE"].title}
        description={RISK_AREAS["HACKABLE"].description}
        requirements={[]}
        riskLevel={getRiskLevelByName("HACKABLE")}
      />
    ),
    "RESPONSE TIME": (
      <RiskDescription
        title={RISK_AREAS["RESPONSE TIME"].title}
        description={RISK_AREAS["RESPONSE TIME"].description}
        requirements={[]}
        riskLevel={getRiskLevelByName("RESPONSE TIME")}
      />
    ),
    "GOV INTERFACES VULNERABILITY": (
      <RiskDescription
        title={RISK_AREAS["GOV INTERFACES VULNERABILITY"].title}
        description={RISK_AREAS["GOV INTERFACES VULNERABILITY"].description}
        requirements={[]}
        riskLevel={getRiskLevelByName("GOV INTERFACES VULNERABILITY")}
      />
    ),
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.riskAnalysis.title}
      icon={<Gauge className="size-6 text-foreground" />}
      description={SECTIONS_CONSTANTS.riskAnalysis.description}
      anchorId={SECTIONS_CONSTANTS.riskAnalysis.anchorId}
      riskLevel={<RiskLevelCard status={RiskLevel.HIGH} />}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="md:w-2/5">
          <RiskAreaCardWrapper
            title="Risk Areas"
            risks={customizedRiskAreas}
            activeRiskId={activeRisk}
            onRiskClick={handleRiskClick}
            gridColumns="grid-cols-2 sm:grid-cols-1"
            variant="risk-analysis"
            hideTitle={true}
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
