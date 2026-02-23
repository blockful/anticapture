import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { DaoIdEnum } from "@/shared/types/daos";
import { HeaderSidebar, StickyPageHeader } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return {
    title: `Anticapture - ${daoId} DAO`,
    description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    },
  };
}

export default function ProposalPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <div className="active relative hidden h-screen lg:flex">
        <div className="h-full w-[68px] shrink-0 overflow-y-auto">
          <HeaderSidebar />
        </div>
      </div>
      <main className="relative flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile withMobileMenu={false} />
          <StickyPageHeader withMobileMenu={false} />
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
