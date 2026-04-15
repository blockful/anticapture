import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string; proposalId: string }>;
  searchParams: Promise<{ proposalType?: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { proposalType } = await props.searchParams;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const isOffchain = proposalType === "offchain";

  const canonicalPath = isOffchain
    ? `/${params.daoId}/proposals/${params.proposalId}?proposalType=offchain`
    : `/${params.daoId}/proposals/${params.proposalId}`;

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

export default async function ProposalPage({ searchParams }: Props) {
  const { proposalType } = await searchParams;

  return (
    <div>
      <ProposalSection isOffchain={proposalType === "offchain"} />
    </div>
  );
}
