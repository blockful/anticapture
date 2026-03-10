import type { Metadata } from "next";

import { ActivityFeedSection } from "@/features/feed";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/activity-feed`;

  return {
    title: `${PAGES_CONSTANTS.activityFeed.title} - ${daoId} | Anticapture`,
    description: PAGES_CONSTANTS.activityFeed.description,
    alternates: { canonical: canonicalPath },
    openGraph: { url: canonicalPath },
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
