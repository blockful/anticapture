import type { Metadata } from "next";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return {
    title: `Anticapture - ${daoId} DAO Holders and Delegates`,
    description: `Explore ${daoId} DAO token holders and delegate distribution.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO Holders and Delegates`,
      description: `Explore ${daoId} DAO token holders and delegate distribution.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO Holders and Delegates`,
      description: `Explore ${daoId} DAO token holders and delegate distribution.`,
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
