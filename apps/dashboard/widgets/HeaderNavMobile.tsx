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
      page: PAGES_CONSTANTS.showSupport.page,
      title: PAGES_CONSTANTS.showSupport.title,
      enabled: !!daoConfig.showSupport,
    },
    {
      page: PAGES_CONSTANTS.daoOverview.page,
      title: PAGES_CONSTANTS.daoOverview.title,
      enabled: !!daoConfig.daoOverview,
    },
    {
      page: PAGES_CONSTANTS.attackProfitability.page,
      title: PAGES_CONSTANTS.attackProfitability.title,
      enabled: !!daoConfig.attackProfitability,
    },
    {
      page: PAGES_CONSTANTS.riskAnalysis.page,
      title: PAGES_CONSTANTS.riskAnalysis.title,
      enabled: !!daoConfig.riskAnalysis,
    },
    {
      page: PAGES_CONSTANTS.governanceImplementation.page,
      title: PAGES_CONSTANTS.governanceImplementation.titleAbbreviation,
      enabled: !!daoConfig.governanceImplementation,
    },
    {
      page: PAGES_CONSTANTS.resilienceStages.page,
      title: PAGES_CONSTANTS.resilienceStages.title,
      enabled: !!daoConfig.resilienceStages,
    },
    {
      page: PAGES_CONSTANTS.tokenDistribution.page,
      title: PAGES_CONSTANTS.tokenDistribution.title,
      enabled: !!daoConfig.tokenDistribution,
    },
    {
      page: PAGES_CONSTANTS.holdersAndDelegates.page,
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
