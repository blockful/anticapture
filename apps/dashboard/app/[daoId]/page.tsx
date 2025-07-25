import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import { BaseHeaderLayoutSidebar } from "@/shared/components/";

import { DaoTemplate } from "@/templates";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HeaderDAOSidebar, HeaderSidebar, StickyPageHeader } from "@/widgets";

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

  return {
    title: `Anticapture - ${daoId} DAO`,
    description: `Explore and mitigate governance risks in ${daoId} DAO.`,
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
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <BaseHeaderLayoutSidebar>
        <HeaderSidebar />
        <HeaderDAOSidebar />
      </BaseHeaderLayoutSidebar>
      <main className="relative flex-1 overflow-auto lg:ml-[330px]">
        <div className="sm:hidden">
          <StickyPageHeader />
          <HeaderMobile />
        </div>
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <DaoTemplate />
          </div>
        </div>
      </main>
    </div>
  );
}
