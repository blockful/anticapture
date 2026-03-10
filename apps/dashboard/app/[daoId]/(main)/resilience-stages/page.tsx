import type { Metadata } from "next";

import { ResilienceStagesSection } from "@/features/resilience-stages";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/resilience-stages`;

  return {
    title: `Anticapture - ${daoId} DAO Resilience Stages`,
    description: `Assess ${daoId} DAO governance resilience and security stages.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `Anticapture - ${daoId} DAO Resilience Stages`,
      description: `Assess ${daoId} DAO governance resilience and security stages.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Resilience Stages`,
      description: `Assess ${daoId} DAO governance resilience and security stages.`,
    },
  };
}

export default async function ResilienceStagesPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants.resilienceStages) {
    return null;
  }

  return <ResilienceStagesSection daoId={daoIdEnum} />;
}
