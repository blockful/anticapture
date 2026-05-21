import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RevenueSection } from "@/features/revenue";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!daoConfig?.revenue) {
    return {};
  }

  return {
    title: "Revenue",
    description: `Protocol financial health: revenue, registrations, and name retention for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelRevenuePage({ params }: Props) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  if (!daoConfigByDaoId[daoIdEnum]?.revenue) {
    notFound();
  }

  return <RevenueSection />;
}
