import { ArrowRightLeft } from "lucide-react";
import type { Metadata } from "next";

import { TokenDistributionSection } from "@/features/token-distribution";
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

  const canonicalPath = `/${params.daoId}/token-distribution`;

  return {
    title: `${daoId} DAO Token Distribution & Governance Concentration Risk — Anticapture`,
    description: `Examine token distribution, concentration metrics, and Gini coefficient for ${daoId} DAO to assess governance security risks and hostile takeover susceptibility.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Token Distribution & Governance Concentration Risk — Anticapture`,
      description: `Examine token distribution, concentration metrics, and Gini coefficient for ${daoId} DAO to assess governance security risks and hostile takeover susceptibility.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Token Distribution & Governance Concentration Risk — Anticapture`,
      description: `Examine token distribution, concentration metrics, and Gini coefficient for ${daoId} DAO to assess governance security risks and hostile takeover susceptibility.`,
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
