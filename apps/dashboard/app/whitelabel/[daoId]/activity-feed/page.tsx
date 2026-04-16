import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  feedEventsPathParamsDaoEnum,
  type FeedEventsPathParams,
} from "@anticapture/client";

import { ActivityFeedSection } from "@/features/feed";
import daoConfigByDaoId from "@/shared/dao-config";
import { toDaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

const supportedDaos: string[] = Object.values(feedEventsPathParamsDaoEnum);

function isSupportedDao(value: string): value is FeedEventsPathParams["dao"] {
  return supportedDaos.includes(value);
}

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
  const feedDaoId = daoId.toLowerCase();

  if (!isSupportedDao(feedDaoId)) {
    redirect(`/whitelabel/${daoId}`);
  }

  return <ActivityFeedSection feedDaoId={feedDaoId} />;
}
