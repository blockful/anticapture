import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import { buildProposalSeoText } from "@/shared/seo/proposalMetadata";
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
        decodeURIComponent(params.proposalId),
      ).catch(() => null)
    : await proposalById(
        params.daoId as ProposalPathParams["dao"],
        params.proposalId,
      ).catch(() => null);

  const descriptionBody = proposal
    ? isOffchainProposal(proposal)
      ? proposal.body
      : proposal.description
    : undefined;

  const canonicalPath = isOffchain
    ? `/${params.daoId}/proposals/${params.proposalId}?proposalType=offchain`
    : `/${params.daoId}/proposals/${params.proposalId}`;
  const { description, fullTitle } = buildProposalSeoText({
    daoId,
    isOffchain,
    title: proposal?.title,
    descriptionBody,
  });

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
