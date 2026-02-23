import { Bomb } from "lucide-react";
import type { Metadata } from "next";

import { RiskAnalysisSection } from "@/features/risk-analysis";
import { TheSectionLayout } from "@/shared/components";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

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

  if (!daoConstants.attackExposure) {
    return null;
  }

  return (
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.attackExposure.title}
        icon={<Bomb className="section-layout-icon" />}
        description={PAGES_CONSTANTS.attackExposure.description}
        className="gap-5"
      >
        <SubSectionsContainer>
          <RiskAnalysisSection daoId={daoIdEnum} />
        </SubSectionsContainer>
      </TheSectionLayout>
    </div>
  );
}
