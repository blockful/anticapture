import type { Metadata } from "next";
import { DaoIdEnum } from "@/lib/types/daos";
import { BaseHeaderLayoutSidebar } from "@/components/atoms";
import {
  HeaderDAOSidebar,
  HeaderMobile,
  HeaderSidebar,
} from "@/components/molecules";
import { DaoTemplate } from "@/components/templates";

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
    <div className="flex h-screen overflow-hidden bg-darkest">
      <BaseHeaderLayoutSidebar>
        <HeaderSidebar />
        <HeaderDAOSidebar />
      </BaseHeaderLayoutSidebar>
      <main className="flex-1 overflow-auto lg:ml-[330px]">
        <div className="sm:hidden">
          <HeaderMobile />
        </div>
        <div className="mx-auto flex flex-col items-center sm:gap-6 sm:p-3">
          <DaoTemplate />
        </div>
      </main>
    </div>
  );
}
