import type { Metadata } from "next";

import { WhitelabelDelegateDetailPage } from "@/features/holders-and-delegates/components/WhitelabelDelegateDetailPage";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string; address: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  return {
    title: "Delegate details",
    description: `Inspect delegate voting behavior and history for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelDelegateAddressPage({ params }: Props) {
  const { daoId, address } = await params;

  return (
    <WhitelabelDelegateDetailPage
      daoId={daoId.toUpperCase() as DaoIdEnum}
      address={address}
    />
  );
}
