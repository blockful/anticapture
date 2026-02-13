import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";

import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HeaderDAOSidebar, HeaderSidebar, StickyPageHeader } from "@/widgets";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { GovernanceSection } from "@/features/governance";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const ogTitle = `Anticapture - ${daoId} DAO`;
  const ogDescription = `Explore and mitigate governance risks in ${daoId} DAO.`;

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}

export default function DaoPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <div className="active relative hidden h-screen lg:flex">
        <div className="h-full w-[68px] shrink-0 overflow-y-auto">
          <HeaderSidebar />
        </div>
        <div className="h-full shrink-0">
          <HeaderDAOSidebar />
        </div>
      </div>
      <main className="relative flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile />
          <StickyPageHeader />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full flex-1">
            <GovernanceSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
