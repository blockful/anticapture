import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import type { DaoIdEnum } from "@/shared/types/daos";

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
    <div>
      <ProposalSection />
    </div>
  );
}
