import type { Metadata } from "next";

import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";
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
    title: "Delegates",
    description: `Explore delegate activity and holder concentration for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelDelegatesPage({ params }: Props) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  return <HoldersAndDelegatesSection daoId={daoIdEnum} />;
}
