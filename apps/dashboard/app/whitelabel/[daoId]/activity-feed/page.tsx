import type { Metadata } from "next";

import { ActivityFeedSection } from "@/features/feed";
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
    title: "Activity Feed",
    description: `Monitor governance activity and participation signals for ${daoConfig.name}.`,
  };
}

export default function WhitelabelActivityFeedPage() {
  return <ActivityFeedSection />;
}
