import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
  searchParams: Promise<{ proposalType?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { daoId } = await params;
  const { proposalType } = await searchParams;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];
  const isOffchain = proposalType === "offchain";

  return {
    title: isOffchain ? "Offchain proposal details" : "Proposal details",
    description: isOffchain
      ? `Review offchain proposal details and Snapshot voting data for ${daoConfig.name}.`
      : `Review proposal details, voting, and participation data for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelProposalPage({ searchParams }: Props) {
  const { proposalType } = await searchParams;

  return <ProposalSection isOffchain={proposalType === "offchain"} />;
}
