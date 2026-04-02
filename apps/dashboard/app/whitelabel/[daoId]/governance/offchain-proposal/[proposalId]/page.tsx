import type { Metadata } from "next";

import { ProposalSection } from "@/features/governance/components/proposal-overview/ProposalSection";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  return {
    title: "Offchain proposal details",
    description: `Review offchain proposal details and Snapshot voting data for ${daoConfig.name}.`,
  };
}

export default function WhitelabelOffchainProposalPage() {
  return <ProposalSection isOffchain />;
}
