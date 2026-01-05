import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoOverviewSection } from "@/features/dao-overview";

export async function generateMetadata(): Promise<Metadata> {
  // const params = await props.params;
  // const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // const imageUrl = `${baseUrl}/opengraph-images/${params.daoId}.png`;

  return {
    title: `Anticapture - ENS DAO`,
    description: `Explore and mitigate governance risks in ENS DAO.`,
    openGraph: {
      title: `Anticapture -    DAO`,
      description: `Explore and mitigate governance risks in  DAO.`,
      images: [
        {
          url: `${baseUrl}/opengraph-images/ens.png`,
          width: 1200,
          height: 630,
          alt: `DAO Open Graph Image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ENS DAO`,
      description: `Explore and mitigate governance risks in ENS DAO.`,
      images: [],
    },
  };
}

export default async function DaoPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants?.daoOverview) {
    return null;
  }

  return <DaoOverviewSection daoId={daoIdEnum} />;
}
