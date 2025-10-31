import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import { BaseHeaderLayoutSidebar } from "@/shared/components/";

import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HeaderSidebar } from "@/widgets";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";

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
    [DaoIdEnum.NOUNS]: `${baseUrl}/opengraph-images/nouns.png`,
    [DaoIdEnum.SCR]: `${baseUrl}/opengraph-images/scr.png`,
    [DaoIdEnum.OBOL]: `${baseUrl}/opengraph-images/obol.png`,
  };

  const imageUrl =
    ogImage[daoId as DaoIdEnum] || `${baseUrl}/opengraph-images/default.png`;

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

export default function ProposalPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <BaseHeaderLayoutSidebar>
        <HeaderSidebar />
      </BaseHeaderLayoutSidebar>
      <main className="relative flex-1 overflow-auto pt-[57px] sm:ml-[70px] sm:pt-0">
        <div className="sm:hidden">
          <HeaderMobile />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full flex-1">
            <ProposalSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
