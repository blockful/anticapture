import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";

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
  };

  const imageUrl =
    ogImage[daoId as DaoIdEnum] || `${baseUrl}/opengraph-images/default.png`;

  return {
    title: `Anticapture - ${daoId} DAO Holders and Delegates`,
    description: `Explore ${daoId} DAO token holders and delegate distribution.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO Holders and Delegates`,
      description: `Explore ${daoId} DAO token holders and delegate distribution.`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${daoId} DAO Holders and Delegates Open Graph Image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Holders and Delegates`,
      description: `Explore ${daoId} DAO token holders and delegate distribution.`,
      images: [imageUrl],
    },
  };
}

export default async function HoldersAndDelegatesPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants.dataTables) {
    return null;
  }

  return <HoldersAndDelegatesSection daoId={daoIdEnum} />;
}
