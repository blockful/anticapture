import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { AttackProfitabilitySection } from "@/features/attack-profitability";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { RiskLevelCard, TheSectionLayout } from "@/shared/components";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { Crosshair2Icon } from "@radix-ui/react-icons";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const ogImage: Record<DaoIdEnum, string> = {
    [DaoIdEnum.ENS]: `${baseUrl}/opengraph-images/ens.png`,
    [DaoIdEnum.UNISWAP]: `${baseUrl}/opengraph-images/uni.png`,
    [DaoIdEnum.OPTIMISM]: `${baseUrl}/opengraph-images/op.png`,
    [DaoIdEnum.GITCOIN]: `${baseUrl}/opengraph-images/gitcoin.png`,
    [DaoIdEnum.SCR]: `${baseUrl}/opengraph-images/scroll.png`,
    [DaoIdEnum.NOUNS]: `${baseUrl}/opengraph-images/nouns.png`,
    [DaoIdEnum.OBOL]: `${baseUrl}/opengraph-images/obol.png`,
    [DaoIdEnum.COMP]: `${baseUrl}/opengraph-images/comp.png`,
    [DaoIdEnum.ZK]: `${baseUrl}/opengraph-images/zk.png`,
  };

  const imageUrl =
    ogImage[daoId as DaoIdEnum] || `${baseUrl}/opengraph-images/default.png`;

  return {
    title: `Anticapture - ${daoId} DAO Attack Profitability`,
    description: `Analyze attack profitability and governance capture costs for ${daoId} DAO.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO Attack Profitability`,
      description: `Analyze attack profitability and governance capture costs for ${daoId} DAO.`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${daoId} DAO Attack Profitability Open Graph Image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Attack Profitability`,
      description: `Analyze attack profitability and governance capture costs for ${daoId} DAO.`,
      images: [imageUrl],
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
    <TheSectionLayout
      title={PAGES_CONSTANTS.attackProfitability.title}
      icon={<Crosshair2Icon className="section-layout-icon" />}
      description={PAGES_CONSTANTS.attackProfitability.description}
      riskLevel={
        <RiskLevelCard status={daoConstants.attackProfitability?.riskLevel} />
      }
    >
      <SubSectionsContainer>
        <AttackProfitabilitySection
          daoId={daoIdEnum}
          attackProfitability={daoConstants.attackProfitability}
        />
      </SubSectionsContainer>
    </TheSectionLayout>
  );
}
