import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import { ActivityFeedSection } from "@/features/feed";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return {
    title: `${PAGES_CONSTANTS.activityFeed.title} - ${daoId} | Anticapture`,
    description: PAGES_CONSTANTS.activityFeed.description,
  };
}

export default async function ActivityFeedPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  await params;

  return <ActivityFeedSection />;
}
