"use client";

import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
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
      anchorId: SECTIONS_CONSTANTS.showSupport.anchorId,
      title: SECTIONS_CONSTANTS.showSupport.title,
      enabled: !!daoConfig.showSupport,
    },
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
      anchorId: SECTIONS_CONSTANTS.riskAnalysis.anchorId,
      title: SECTIONS_CONSTANTS.riskAnalysis.title,
      enabled: !!daoConfig.riskAnalysis,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceImplementation.anchorId,
      title: SECTIONS_CONSTANTS.governanceImplementation.titleAbbreviation,
      enabled: !!daoConfig.governanceImplementation,
    },
    {
      anchorId: SECTIONS_CONSTANTS.resilienceStages.anchorId,
      title: SECTIONS_CONSTANTS.resilienceStages.title,
      enabled: !!daoConfig.resilienceStages,
    },
    {
      anchorId: SECTIONS_CONSTANTS.tokenDistribution.anchorId,
      title: SECTIONS_CONSTANTS.tokenDistribution.title,
      enabled: !!daoConfig.tokenDistribution,
    },
    {
      anchorId: SECTIONS_CONSTANTS.holdersAndDelegates.anchorId,
      title: SECTIONS_CONSTANTS.holdersAndDelegates.title,
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
