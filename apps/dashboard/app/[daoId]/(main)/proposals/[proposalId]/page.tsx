import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  type OffchainProposalByIdPathParams,
  type ProposalPathParams,
  type OnchainProposal,
  type OffchainProposal,
  offchainProposalById,
  proposal as proposalById,
} from "@anticapture/client";

type Props = {
  params: Promise<{ daoId: string; proposalId: string }>;
  searchParams: Promise<{ proposalType?: string }>;
};

function isOffchainProposal(
  p: OnchainProposal | OffchainProposal,
): p is OffchainProposal {
  return "spaceId" in p;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { proposalType } = await props.searchParams;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const isOffchain = proposalType === "offchain";

  const proposal = isOffchain
    ? await offchainProposalById(
        params.daoId as OffchainProposalByIdPathParams["dao"],
        params.proposalId,
      )
    : await proposalById(
        params.daoId as ProposalPathParams["dao"],
        params.proposalId,
      );

  const descriptionBody = proposal
    ? isOffchainProposal(proposal)
      ? proposal.body
      : proposal.description
    : undefined;

  const canonicalPath = isOffchain
    ? `/${params.daoId}/proposals/${params.proposalId}?proposalType=offchain`
    : `/${params.daoId}/proposals/${params.proposalId}`;
  const description =
    descriptionBody ||
    `Analyze the governance security implications of "${proposal.title}" in ${daoId} DAO, including vote distribution, delegate participation, and potential governance capture signals.`;
  const fullTitle = `${proposal.title} | ${daoId} DAO Governance Security Analysis | Anticapture`;

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

export default async function ProposalPage({ searchParams }: Props) {
  const { proposalType } = await searchParams;

  return (
    <div>
      <ProposalSection isOffchain={proposalType === "offchain"} />
    </div>
  );
}
