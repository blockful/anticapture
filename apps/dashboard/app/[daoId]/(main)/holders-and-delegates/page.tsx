import type { Metadata } from "next";

import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/holders-and-delegates`;

  return {
    title: `${daoId} DAO Token Holders & Delegate Security Analysis — Anticapture`,
    description: `Analyze token holder concentration and delegate distribution for ${daoId} DAO to identify governance capture risks, whale dominance, and delegate centralization threats.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Token Holders & Delegate Security Analysis — Anticapture`,
      description: `Analyze token holder concentration and delegate distribution for ${daoId} DAO to identify governance capture risks, whale dominance, and delegate centralization threats.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Token Holders & Delegate Security Analysis — Anticapture`,
      description: `Analyze token holder concentration and delegate distribution for ${daoId} DAO to identify governance capture risks, whale dominance, and delegate centralization threats.`,
    },
  };
}

export default async function HoldersAndDelegatesPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  if (!daoConstants.dataTables) {
    return null;
  }

  return <HoldersAndDelegatesSection daoId={daoIdEnum} />;
}
