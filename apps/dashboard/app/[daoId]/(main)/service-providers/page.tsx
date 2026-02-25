import type { Metadata } from "next";

import { ServiceProvidersSection } from "@/features/service-providers";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return {
    title: `Anticapture - ${daoId} Service Providers`,
    description: `Monitor the publication status of quarterly reports from ${daoId} DAO-funded service providers.`,
    openGraph: {
      title: `Anticapture - ${daoId} Service Providers`,
      description: `Monitor the publication status of quarterly reports from ${daoId} DAO-funded service providers.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} Service Providers`,
      description: `Monitor the publication status of quarterly reports from ${daoId} DAO-funded service providers.`,
    },
  };
}

export default async function ServiceProvidersPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants?.serviceProviders) {
    return null;
  }

  return <ServiceProvidersSection />;
}
