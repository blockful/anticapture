import { ArrowRightLeft } from "lucide-react";
import type { Metadata } from "next";

import { TokenDistributionSection } from "@/features/token-distribution";
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
    title: `Anticapture - ${daoId} DAO Token Distribution`,
    description: `Analyze token distribution and concentration for ${daoId} DAO.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO Token Distribution`,
      description: `Analyze token distribution and concentration for ${daoId} DAO.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Token Distribution`,
      description: `Analyze token distribution and concentration for ${daoId} DAO.`,
    },
  };
}

export default async function TokenDistributionPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants.tokenDistribution) {
    return null;
  }

  return (
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.tokenDistribution.title}
        icon={<ArrowRightLeft className="section-layout-icon" />}
        description={PAGES_CONSTANTS.tokenDistribution.description}
      >
        <SubSectionsContainer>
          <TokenDistributionSection daoId={daoIdEnum} />
        </SubSectionsContainer>
      </TheSectionLayout>
    </div>
  );
}
