import type { Metadata } from "next";
import { DaoTemplate } from "@/components/templates";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";

type Props = {
  params: { daoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoId];

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const ogImage: Record<
    Exclude<DaoIdEnum, DaoIdEnum.OPTIMISM | DaoIdEnum.ARBITRUM>,
    string
  > = {
    [DaoIdEnum.ENS]: `${baseUrl}/opengraph-images/ens.png`,
    [DaoIdEnum.UNISWAP]: `${baseUrl}/opengraph-images/uni.png`,
  };

  const imageUrl =
    ogImage[
      daoId as Exclude<DaoIdEnum, DaoIdEnum.OPTIMISM | DaoIdEnum.ARBITRUM>
    ] || `${baseUrl}/opengraph-images/default.png`;

  // Generate title and description based on support stage
  let title = `Anticapture - ${daoId} DAO`;
  let description = `Explore and mitigate governance risks in ${daoId} DAO.`;

  switch (daoConstants.supportStage) {
    case SupportStageEnum.EMPTY_ANALYSIS:
      title = `Anticapture - ${daoId} DAO (Coming Soon)`;
      description = `The ${daoId} DAO is currently under analysis. Check back later for updates.`;
      break;
    case SupportStageEnum.PARTIAL_ANALYSIS:
    case SupportStageEnum.ELECTION:
      description = `Explore preliminary governance analysis for ${daoId} DAO.`;
      break;
    // FULL stage uses default title and description
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${daoId} DAO Open Graph Image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function DaoPage() {
  return (
    <div className="mx-auto flex flex-col items-center sm:gap-8 sm:px-8 sm:py-6 lg:gap-16">
      <DaoTemplate />
    </div>
  );
}
