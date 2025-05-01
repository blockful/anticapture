"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
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

export const RiskAnalysisSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [activeRisk, setActiveRisk] = useState<string | undefined>(undefined);

  const handleRiskClick = (riskName: string) => {
    setActiveRisk(activeRisk === riskName ? undefined : riskName);
  };

  // Define the risk areas as shown in the reference image
  const riskAreas: RiskArea[] = [
    { name: "SPAM VULNERABLE", level: RiskLevel.LOW },
    { name: "EXTRACTABLE VALUE", level: RiskLevel.MEDIUM },
    { name: "SAFEGUARDS", level: RiskLevel.MEDIUM },
    { name: "HACKABLE", level: RiskLevel.HIGH },
    { name: "RESPONSE TIME", level: RiskLevel.LOW },
    { name: "GOV INTERFACES VULNERABILITY", level: RiskLevel.HIGH },
  ];

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
  const getRiskLevelByName = (name: string): RiskLevel => {
    const area = riskAreas.find((area) => area.name === name);
    return area?.level || RiskLevel.LOW;
  };

  // Risk area descriptions using the RiskDescription component
  const riskDescriptions: Record<string, React.ReactNode> = {
    "SPAM VULNERABLE": (
      <RiskDescription
        title="Spam Vulnerable"
        description={[
          "Means the system can be overwhelmed by malicious or low-quality proposals. This wastes resources, discourages real participation and exposes the DAO to a war of attrition.",
          "It usually happens when there's no checks to submit proposals, or the implementation allows it to be ignored.",
        ]}
        requirements={spamVulnerableRequirements}
        riskLevel={getRiskLevelByName("SPAM VULNERABLE")}
      />
    ),
    // Examples of other risk descriptions (to be implemented later)
    "EXTRACTABLE VALUE": (
      <RiskDescription
        title="Extractable Value"
        description="Risk description for extractable value will go here."
        requirements={[]}
        riskLevel={getRiskLevelByName("EXTRACTABLE VALUE")}
      />
    ),
    SAFEGUARDS: (
      <RiskDescription
        title="Safeguards"
        description="Risk description for safeguards will go here."
        requirements={[]}
        riskLevel={getRiskLevelByName("SAFEGUARDS")}
      />
    ),
    HACKABLE: (
      <RiskDescription
        title="Hackable"
        description="Risk description for hackable will go here."
        requirements={[]}
        riskLevel={getRiskLevelByName("HACKABLE")}
      />
    ),
    "RESPONSE TIME": (
      <RiskDescription
        title="Response Time"
        description="Risk description for response time will go here."
        requirements={[]}
        riskLevel={getRiskLevelByName("RESPONSE TIME")}
      />
    ),
    "GOV INTERFACES VULNERABILITY": (
      <RiskDescription
        title="Gov Interfaces Vulnerability"
        description="Risk description for governance interfaces vulnerability will go here."
        requirements={[]}
        riskLevel={getRiskLevelByName("GOV INTERFACES VULNERABILITY")}
      />
    ),
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.riskAnalysis.title}
      icon={<ShieldAlert className="size-6 text-foreground" />}
      description={SECTIONS_CONSTANTS.riskAnalysis.description}
      anchorId={SECTIONS_CONSTANTS.riskAnalysis.anchorId}
      riskLevel={<RiskLevelCard status={RiskLevel.HIGH} />}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-2/5">
          <RiskAreaCardWrapper
            title="Risk Areas"
            risks={riskAreas}
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
            <div className="flex items-center justify-center h-full p-5 border border-lightDark bg-dark">
              <p className="text-foreground text-center">
                Select a risk area to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </TheSectionLayout>
  );
};
