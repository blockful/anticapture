import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceProvidersSection } from "@/features/service-providers";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!daoConfig?.serviceProviders) {
    return {};
  }

  return {
    title: "Service Providers",
    description: `Track funded service providers and reporting accountability for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelServiceProvidersPage({
  params,
}: Props) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  if (!daoConfigByDaoId[daoIdEnum]?.serviceProviders) {
    notFound();
  }

  return <ServiceProvidersSection />;
}
