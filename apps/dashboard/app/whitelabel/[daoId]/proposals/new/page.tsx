import type { Metadata } from "next";

import { ProposalCreationForm } from "@/features/create-proposal/components/ProposalCreationForm";
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
    title: "New Proposal",
    description: `Create a new governance proposal for ${daoConfig.name}.`,
  };
}

export default function NewProposalPage() {
  return <ProposalCreationForm />;
}
