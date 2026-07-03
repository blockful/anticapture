import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActivityFeedSection } from "@/features/feed";
import daoConfigByDaoId from "@/shared/dao-config";
import { toDaoIdEnum } from "@/shared/types/daos";

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
  const daoIdEnum = toDaoIdEnum(daoId);
  const feedDaoId = daoId.toLowerCase();
  const daoConfig = daoIdEnum ? daoConfigByDaoId[daoIdEnum] : undefined;

  if (!daoConfig?.activityFeed) {
    redirect(`/${daoId}`);
  }

  return <ActivityFeedSection feedDaoId={feedDaoId} />;
}

type Props = {
  params: Promise<{ daoId: string }>;
};
