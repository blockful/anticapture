import type { Metadata } from "next";

import { ServiceProvidersSection } from "@/features/service-providers";
import {
  ENS_SERVICE_PROVIDERS,
  GITHUB_TRACKED_YEARS,
} from "@/features/service-providers/constants/ens-service-providers";
import { fetchProviderYearData } from "@/features/service-providers/utils/fetchProviderYearData";
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

  const providers = await Promise.all(
    ENS_SERVICE_PROVIDERS.map(async (provider) => {
      const dynamicYears: Record<
        number,
        Awaited<ReturnType<typeof fetchProviderYearData>>
      > = {};

      for (const year of GITHUB_TRACKED_YEARS) {
        dynamicYears[year] = await fetchProviderYearData(
          provider.githubSlug,
          year,
        );
      }

      return {
        ...provider,
        years: {
          ...provider.years,
          ...dynamicYears,
        },
      };
    }),
  );

  return <ServiceProvidersSection providers={providers} />;
}
