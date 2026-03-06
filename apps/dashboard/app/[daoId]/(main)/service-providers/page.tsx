import type { Metadata } from "next";

import { ServiceProvidersSection } from "@/features/service-providers";
import { ENS_SERVICE_PROVIDERS } from "@/features/service-providers/constants/ens-service-providers";
import { fetchServiceProvidersData } from "@/features/service-providers/utils/fetchServiceProvidersData";
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

  const serviceProvidersData = await fetchServiceProvidersData(
    ENS_SERVICE_PROVIDERS.map((p) => p.githubSlug),
  );

  const providers = ENS_SERVICE_PROVIDERS.map((provider) => ({
    ...provider,
    years: Object.fromEntries(
      Object.entries(serviceProvidersData)
        .filter(([, slugData]) => slugData[provider.githubSlug])
        .map(([year, slugData]) => [year, slugData[provider.githubSlug]]),
    ),
  }));

  return <ServiceProvidersSection providers={providers} />;
}
