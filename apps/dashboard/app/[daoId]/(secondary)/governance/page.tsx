import type { Metadata } from "next";

import { GovernanceSection } from "@/features/governance";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import type { DaoIdEnum } from "@/shared/types/daos";
import { HeaderDAOSidebar, HeaderSidebar, StickyPageHeader } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/governance`;

  return {
    title: `${daoId} DAO Governance Proposals | Security Analysis — Anticapture`,
    description: `Browse and analyze governance proposals for ${daoId} DAO. Track voting patterns, delegate participation, and governance capture signals across on-chain proposals.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Governance Proposals | Security Analysis — Anticapture`,
      description: `Browse and analyze governance proposals for ${daoId} DAO. Track voting patterns, delegate participation, and governance capture signals across on-chain proposals.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Governance Proposals | Security Analysis — Anticapture`,
      description: `Browse and analyze governance proposals for ${daoId} DAO. Track voting patterns, delegate participation, and governance capture signals across on-chain proposals.`,
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
