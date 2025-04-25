"use client";

import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { ButtonHeaderDAOSidebarMobile } from "@/components/atoms";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";

export const HeaderNavMobile = () => {
  const { daoId }: { daoId: string } = useParams();
  if (!daoId) {
    return null;
  }
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  const options = [
    {
      anchorId: SECTIONS_CONSTANTS.daoOverview.anchorId,
      title: SECTIONS_CONSTANTS.daoOverview.title,
      enabled: !!daoConfig.daoOverview,
    },
    {
      anchorId: SECTIONS_CONSTANTS.attackProfitability.anchorId,
      title: SECTIONS_CONSTANTS.attackProfitability.title,
      enabled: !!daoConfig.attackProfitability,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceImplementation.anchorId,
      title: SECTIONS_CONSTANTS.governanceImplementation.titleAbbreviation,
      enabled: !!daoConfig.governanceImplementation,
    },
    {
      anchorId: SECTIONS_CONSTANTS.tokenDistribution.anchorId,
      title: SECTIONS_CONSTANTS.tokenDistribution.title,
      enabled: !!daoConfig.tokenDistribution,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceActivity.anchorId,
      title: SECTIONS_CONSTANTS.governanceActivity.title,
      enabled: !!daoConfig.governanceActivity,
    },
    {
      anchorId: SECTIONS_CONSTANTS.showSupport.anchorId,
      title: SECTIONS_CONSTANTS.showSupport.title,
      enabled: daoConfig.showSupport,
    },
  ];

  return (
    <div className="w-full">
      <div className="scrollbar-none w-full overflow-x-auto">
        <ButtonHeaderDAOSidebarMobile options={options} />
      </div>
    </div>
  );
};
