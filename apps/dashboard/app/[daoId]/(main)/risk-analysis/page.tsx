import { Bomb } from "lucide-react";
import type { Metadata } from "next";

import { RiskAnalysisSection } from "@/features/risk-analysis";
import { TheSectionLayout } from "@/shared/components";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/risk-analysis`;

  return {
    title: `${daoId} DAO Governance Risk Analysis | Hostile Takeover Assessment — Anticapture`,
    description: `Deep governance risk analysis for ${daoId} DAO — quantifying hostile takeover costs, governance capture vectors, voter apathy risks, and attack profitability metrics.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Governance Risk Analysis | Hostile Takeover Assessment — Anticapture`,
      description: `Deep governance risk analysis for ${daoId} DAO — quantifying hostile takeover costs, governance capture vectors, voter apathy risks, and attack profitability metrics.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Governance Risk Analysis | Hostile Takeover Assessment — Anticapture`,
      description: `Deep governance risk analysis for ${daoId} DAO — quantifying hostile takeover costs, governance capture vectors, voter apathy risks, and attack profitability metrics.`,
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
