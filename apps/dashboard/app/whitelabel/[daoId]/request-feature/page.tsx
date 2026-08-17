import type { Metadata } from "next";

import { RequestFeatureSection } from "@/features/request-feature/RequestFeatureSection";
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
    title: "Request a Feature",
    description: `Share your suggestions for new features, metrics, and improvements you'd like to see in the ${daoConfig.name} Governance Dashboard.`,
  };
}

export default function WhitelabelRequestFeaturePage() {
  return <RequestFeatureSection />;
}
