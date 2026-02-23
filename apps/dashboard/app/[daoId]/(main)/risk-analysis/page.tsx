import { Gauge } from "lucide-react";
import type { Metadata } from "next";

import { GovernanceImplementationSection } from "@/features/governance-implementation";
import { RiskAnalysisSection } from "@/features/risk-analysis";
import { RiskLevelCard, TheSectionLayout } from "@/shared/components";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskLevel } from "@/shared/types/enums";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return {
    title: `Anticapture - ${daoId} DAO Risk Analysis`,
    description: `Analyze governance risks and security threats for ${daoId} DAO.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO Risk Analysis`,
      description: `Analyze governance risks and security threats for ${daoId} DAO.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Risk Analysis`,
      description: `Analyze governance risks and security threats for ${daoId} DAO.`,
    },
  };
}

export default async function RiskAnalysisPage({
  params,
}: {
  params: Promise<{ daoId: DaoIdEnum }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants.riskAnalysis) {
    return null;
  }

  const daoRiskAreas = getDaoRiskAreas(daoIdEnum);

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
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.riskAnalysis.title}
        icon={<Gauge className="section-layout-icon" />}
        description={PAGES_CONSTANTS.riskAnalysis.description}
        riskLevel={<RiskLevelCard status={getHighestRiskLevel()} />}
      >
        <SubSectionsContainer>
          <SubSection
            subsectionTitle={PAGES_CONSTANTS.riskAnalysis.subTitle}
            subsectionDescription={PAGES_CONSTANTS.riskAnalysis.subDescription}
            dateRange=""
          >
            <RiskAnalysisSection daoId={daoIdEnum} />
          </SubSection>
          <DividerDefault isHorizontal />
          <SubSection
            subsectionTitle={PAGES_CONSTANTS.governanceImplementation.subTitle}
            subsectionDescription={
              PAGES_CONSTANTS.governanceImplementation.subDescription
            }
            dateRange=""
          >
            <GovernanceImplementationSection daoId={daoIdEnum} />
          </SubSection>
        </SubSectionsContainer>
      </TheSectionLayout>
    </div>
  );
}
