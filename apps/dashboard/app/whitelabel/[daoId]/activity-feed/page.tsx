import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActivityFeedSection } from "@/features/feed";
import daoConfigByDaoId from "@/shared/dao-config";
import { toDaoIdEnum } from "@/shared/types/daos";

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

  return {
    title: "Activity Feed",
    description: `Monitor governance activity and participation signals for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelActivityFeedPage({ params }: Props) {
  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);
  const feedDaoId = daoId.toLowerCase();
  const daoConfig = daoIdEnum ? daoConfigByDaoId[daoIdEnum] : undefined;

  if (!daoConfig?.activityFeed) {
    redirect(`/whitelabel/${daoId}`);
  }

  return <ActivityFeedSection feedDaoId={feedDaoId} />;
}
