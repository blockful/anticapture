import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  type OffchainProposalByIdPathParams,
  offchainProposalById,
} from "@anticapture/client";

type Props = {
  params: Promise<{ daoId: string; proposalId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const decodedProposalId = decodeURIComponent(params.proposalId);
  const proposal = await offchainProposalById(
    params.daoId as OffchainProposalByIdPathParams["dao"],
    decodedProposalId,
  ).catch(() => null);

  const canonicalPath = `/${params.daoId}/governance/offchain-proposal/${params.proposalId}`;
  const proposalTitle =
    proposal?.title ?? `${daoId} DAO Offchain Governance Proposal`;
  const description =
    proposal?.body ||
    `Analyze the governance security implications of "${proposalTitle}" in ${daoId} DAO, including delegate participation, offchain voting dynamics, and governance capture signals.`;
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

export default function OffchainProposalPage() {
  return (
    <div>
      <ProposalSection isOffchain />
    </div>
  );
}
