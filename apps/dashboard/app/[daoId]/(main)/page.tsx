import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DaoOverviewSection } from "@/features/dao-overview";
import daoConfigByDaoId from "@/shared/dao-config";
import { JsonLd } from "@/shared/seo/JsonLd";
import { toAbsoluteUrl } from "@/shared/seo/site";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}`;

  return {
    title: `${daoId} DAO Governance Security | Risk Dashboard - Anticapture`,
    description: `Monitor governance security, hostile takeover risks, token concentration, and resilience scores for ${daoId} DAO. Powered by Anticapture's open security framework.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Governance Security | Risk Dashboard - Anticapture`,
      description: `Monitor governance security, hostile takeover risks, token concentration, and resilience scores for ${daoId} DAO. Powered by Anticapture's open security framework.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Governance Security | Risk Dashboard - Anticapture`,
      description: `Monitor governance security, hostile takeover risks, token concentration, and resilience scores for ${daoId} DAO. Powered by Anticapture's open security framework.`,
    },
  };
}
export default async function DaoPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (daoConfig?.initialPage) {
    redirect(`/${daoId.toLowerCase()}/${daoConfig.initialPage}`);
  }

  if (!daoConfig?.daoOverview) {
    redirect("/");
  }

  const daoSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${daoConfig.name} DAO Governance Security Dashboard`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: toAbsoluteUrl(`/${daoId.toLowerCase()}`),
    description: `Monitor governance security, hostile takeover risks, token concentration, and resilience scores for ${daoIdEnum} DAO.`,
    publisher: {
      "@type": "Organization",
      name: "Anticapture",
    },
  };

  return (
    <>
      <JsonLd data={daoSchema} />
      <DaoOverviewSection daoId={daoIdEnum} />
    </>
  );
}
