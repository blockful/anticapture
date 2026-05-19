import type { Metadata } from "next";

import { RevenueSection } from "@/features/revenue";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoId];

  if (!daoConfig?.revenue) {
    return {};
  }

  const canonicalPath = `/${params.daoId}/revenue`;

  return {
    title: `${daoId} DAO Revenue | Protocol Financial Health — Anticapture`,
    description: `Track ${daoConfig.name} protocol revenue by stream, registration and renewal activity over time, name retention health, and expiration risk.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Revenue | Protocol Financial Health — Anticapture`,
      description: `Track ${daoConfig.name} protocol revenue by stream, registration and renewal activity over time, name retention health, and expiration risk.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Revenue | Protocol Financial Health — Anticapture`,
      description: `Track ${daoConfig.name} protocol revenue by stream, registration and renewal activity over time, name retention health, and expiration risk.`,
    },
  };
}

export default async function RevenuePage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  if (!daoConfigByDaoId[daoIdEnum]?.revenue) {
    return null;
  }

  return <RevenueSection />;
}
