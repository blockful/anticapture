import type { Metadata } from "next";

import { AlertsSection } from "@/features/alerts";
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
    title: "Notifications",
    description: `Receive real-time alerts on governance security threats for ${daoConfig.name}.`,
  };
}

export default function WhitelabelNotificationsPage() {
  return <AlertsSection />;
}
