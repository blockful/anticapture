import type { Metadata } from "next";
import { DaoTemplate } from "@/components/templates";
import { DaoIdEnum } from "@/lib/types/daos";

type Props = {
  params: { daoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

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

  return {
    title,
    description,
    openGraph: {
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
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
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
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
