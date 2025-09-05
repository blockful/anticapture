"use client";

import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { ButtonHeaderDAOSidebarMobile } from "@/shared/components";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";

export const HeaderNavMobile = () => {
  const { daoId }: { daoId: string } = useParams();
  if (!daoId) {
    return null;
  }
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  const options = [
    {
      anchorId: PAGES_CONSTANTS.showSupport.anchorId,
      title: PAGES_CONSTANTS.showSupport.title,
      enabled: !!daoConfig.showSupport,
    },
    {
      anchorId: PAGES_CONSTANTS.daoOverview.anchorId,
      title: PAGES_CONSTANTS.daoOverview.title,
      enabled: !!daoConfig.daoOverview,
    },
    {
      anchorId: PAGES_CONSTANTS.attackProfitability.anchorId,
      title: PAGES_CONSTANTS.attackProfitability.title,
      enabled: !!daoConfig.attackProfitability,
    },
    {
      anchorId: PAGES_CONSTANTS.riskAnalysis.anchorId,
      title: PAGES_CONSTANTS.riskAnalysis.title,
      enabled: !!daoConfig.riskAnalysis,
    },
    {
      anchorId: PAGES_CONSTANTS.governanceImplementation.anchorId,
      title: PAGES_CONSTANTS.governanceImplementation.titleAbbreviation,
      enabled: !!daoConfig.governanceImplementation,
    },
    {
      anchorId: PAGES_CONSTANTS.resilienceStages.anchorId,
      title: PAGES_CONSTANTS.resilienceStages.title,
      enabled: !!daoConfig.resilienceStages,
    },
    {
      anchorId: PAGES_CONSTANTS.tokenDistribution.anchorId,
      title: PAGES_CONSTANTS.tokenDistribution.title,
      enabled: !!daoConfig.tokenDistribution,
    },
    {
      anchorId: PAGES_CONSTANTS.holdersAndDelegates.anchorId,
      title: PAGES_CONSTANTS.holdersAndDelegates.title,
      enabled: true,
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
