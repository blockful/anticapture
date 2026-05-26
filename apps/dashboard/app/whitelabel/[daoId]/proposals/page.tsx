import type { Metadata } from "next";

import { GovernanceSection } from "@/features/governance";
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
    title: "Proposals",
    description: `Track active and historical governance proposals for ${daoConfig.name}.`,
  };
}

export default function WhitelabelProposalsPage() {
  return <GovernanceSection />;
}
