import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  feedEventsPathParamsDaoEnum,
  type FeedEventsPathParams,
} from "@anticapture/client";
import { ActivityFeedSection } from "@/features/feed";

type Props = {
  params: Promise<{ daoId: string }>;
};

const supportedDaos: FeedEventsPathParams["dao"][] = Object.values(
  feedEventsPathParamsDaoEnum,
);

const isSupportedDao = (value: string): value is FeedEventsPathParams["dao"] =>
  supportedDaos.includes(value as FeedEventsPathParams["dao"]);

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase();

  const canonicalPath = `/${params.daoId}/activity-feed`;
  const title = `${daoId} DAO Governance Activity Feed | Risk Signals | Anticapture`;
  const description = `Track governance activity for ${daoId} DAO, including proposal events, delegate behavior, and power shifts that may signal emerging governance risk.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
