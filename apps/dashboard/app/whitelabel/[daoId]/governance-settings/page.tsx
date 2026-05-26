import type { Metadata } from "next";

import { GovernanceSettingsSection } from "@/features/governance-settings/GovernanceSettingsSection";
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
    title: "Governance Settings",
    description: `View the contracts and parameters that govern how ${daoConfig.name} operates.`,
  };
}

export default function WhitelabelGovernanceSettingsPage() {
  return <GovernanceSettingsSection />;
}
