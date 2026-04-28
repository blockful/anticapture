import type { Metadata } from "next";

import { ProposalCreationForm } from "@/features/create-proposal/components/ProposalCreationForm";
import daoConfigByDaoId from "@/shared/dao-config";
import { toDaoIdEnum } from "@/shared/types/daos";
import { isWhitelabelDao } from "@/shared/utils/whitelabel";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) {
    return {};
  }

  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!daoConfig || !isWhitelabelDao(daoConfig)) {
    return {};
  }

  return {
    title: "New Proposal",
    description: `Create a new governance proposal for ${daoConfig.name}.`,
  };
}

export default function NewProposalPage() {
  return <ProposalCreationForm />;
}
