import type { Metadata } from "next";

import { ActivityFeedSection } from "@/features/feed";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

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
  await params;

  return <ActivityFeedSection />;
}
