import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import { getOnchainProposalSeoData } from "@/shared/seo/graphql";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string; proposalId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const proposal = await getOnchainProposalSeoData(
    daoId,
    params.proposalId,
  ).catch(() => null);

  const canonicalPath = `/${params.daoId}/governance/proposal/${params.proposalId}`;
  const proposalTitle = proposal?.title ?? `${daoId} DAO Governance Proposal`;
  const description =
    proposal?.description ||
    `Analyze the governance security implications of "${proposalTitle}" in ${daoId} DAO, including vote distribution, delegate participation, and potential governance capture signals.`;
  const fullTitle = `${proposalTitle} | ${daoId} DAO Governance Security Analysis | Anticapture`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
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
