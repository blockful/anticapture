import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  feedEventsPathParamsDaoEnum,
  type FeedEventsPathParams,
} from "@anticapture/client";

import { ActivityFeedSection } from "@/features/feed";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

type Props = {
  params: Promise<{ daoId: string }>;
};

const supportedDaos: string[] = Object.values(feedEventsPathParamsDaoEnum);

function isSupportedDao(value: string): value is FeedEventsPathParams["dao"] {
  return supportedDaos.includes(value);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase();

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
  const { daoId } = await params;
  const feedDaoId = daoId.toLowerCase();

  if (!isSupportedDao(feedDaoId)) {
    redirect(`/${daoId}`);
  }

  return <ActivityFeedSection feedDaoId={feedDaoId} />;
}
