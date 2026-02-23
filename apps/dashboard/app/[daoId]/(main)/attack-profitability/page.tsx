import { Crosshair2Icon } from "@radix-ui/react-icons";
import type { Metadata } from "next";

import { AttackProfitabilitySection } from "@/features/attack-profitability";
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
    title: `Anticapture - ${daoId} DAO Attack Profitability`,
    description: `Analyze attack profitability and governance capture costs for ${daoId} DAO.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO Attack Profitability`,
      description: `Analyze attack profitability and governance capture costs for ${daoId} DAO.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Attack Profitability`,
      description: `Analyze attack profitability and governance capture costs for ${daoId} DAO.`,
    },
  };
}

export default async function AttackProfitabilityPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants.attackProfitability) {
    return null;
  }

  return (
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.attackProfitability.title}
        icon={<Crosshair2Icon className="section-layout-icon" />}
        description={PAGES_CONSTANTS.attackProfitability.description}
      >
        <SubSectionsContainer>
          <AttackProfitabilitySection
            daoId={daoIdEnum}
            attackProfitability={daoConstants.attackProfitability}
          />
        </SubSectionsContainer>
      </TheSectionLayout>
    </div>
  );
}
