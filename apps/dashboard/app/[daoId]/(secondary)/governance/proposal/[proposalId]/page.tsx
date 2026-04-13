import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import type { DaoIdEnum } from "@/shared/types/daos";
import { HeaderSidebar, StickyPageHeader } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

type Props = {
  params: Promise<{ daoId: string; proposalId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/governance/proposal/${params.proposalId}`;

  return {
    title: `${daoId} DAO Governance Proposal | Security Analysis — Anticapture`,
    description: `Analyze the governance security implications of this proposal in ${daoId} DAO — including vote distribution, delegate participation, and potential governance capture signals.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Governance Proposal | Security Analysis — Anticapture`,
      description: `Analyze the governance security implications of this proposal in ${daoId} DAO — including vote distribution, delegate participation, and potential governance capture signals.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Governance Proposal | Security Analysis — Anticapture`,
      description: `Analyze the governance security implications of this proposal in ${daoId} DAO — including vote distribution, delegate participation, and potential governance capture signals.`,
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
