import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DaoOverviewSection } from "@/features/dao-overview";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}`;

  return {
    title: `Anticapture - ${daoId} DAO`,
    description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    },
  };
};
const DaoPage = async ({ params }: { params: Promise<{ daoId: string }> }) => {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (daoConfig?.initialPage) {
    redirect(`/${daoId.toLowerCase()}/${daoConfig.initialPage}`);
  }

  if (!daoConfig?.daoOverview) {
    redirect("/");
  }

  return <DaoOverviewSection daoId={daoIdEnum} />;
};

export default DaoPage;
