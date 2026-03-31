import type { Metadata } from "next";

import { ServiceProvidersSection } from "@/features/service-providers";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/service-providers`;

  return {
    title: `${daoId} DAO Service Provider Accountability | Governance Transparency — Anticapture`,
    description: `Track quarterly report compliance and accountability of ${daoId} DAO-funded service providers. Monitor governance transparency and identify reporting gaps that create security risks.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Service Provider Accountability | Governance Transparency — Anticapture`,
      description: `Track quarterly report compliance and accountability of ${daoId} DAO-funded service providers. Monitor governance transparency and identify reporting gaps that create security risks.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Service Provider Accountability | Governance Transparency — Anticapture`,
      description: `Track quarterly report compliance and accountability of ${daoId} DAO-funded service providers. Monitor governance transparency and identify reporting gaps that create security risks.`,
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
