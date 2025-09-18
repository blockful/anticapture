"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HeaderDAOSidebarDropdown,
  ButtonHeaderSidebar,
} from "@/shared/components";
import { BarChart, Gauge, HeartIcon, Lightbulb, UserCheck } from "lucide-react";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import { ArrowRightLeft, PieChart } from "lucide-react";
import { Crosshair2Icon } from "@radix-ui/react-icons";
export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const daoConfig = daoConfigByDaoId[daoId as DaoIdEnum];

  if (daoConfig.disableDaoPage) {
    return null;
  }

  return (
    <aside
      className={`border-light-dark bg-surface-background fixed left-[68px] top-0 z-50 hidden h-screen w-[258px] border-r sm:block`}
    >
      <div className="flex h-full w-full flex-col">
        <HeaderDAOSidebarDropdown />
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-3 p-4">
            {daoConfig.daoOverview && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.daoOverview.anchorId}
                icon={PieChart}
                label={SECTIONS_CONSTANTS.daoOverview.title}
                key={SECTIONS_CONSTANTS.daoOverview.anchorId}
              />
            )}
            {daoConfig.showSupport && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
                icon={HeartIcon}
                label={SECTIONS_CONSTANTS.showSupport.title}
                key={SECTIONS_CONSTANTS.showSupport.anchorId}
              />
            )}
            {daoConfig.attackProfitability && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
                icon={Crosshair2Icon}
                label={SECTIONS_CONSTANTS.attackProfitability.title}
                key={SECTIONS_CONSTANTS.attackProfitability.anchorId}
              />
            )}
            {daoConfig.riskAnalysis && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.riskAnalysis.anchorId}
                icon={Gauge}
                label={SECTIONS_CONSTANTS.riskAnalysis.title}
                key={SECTIONS_CONSTANTS.riskAnalysis.anchorId}
              />
            )}
            {daoConfig.governanceImplementation && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
                icon={Lightbulb}
                label={
                  SECTIONS_CONSTANTS.governanceImplementation.titleAbbreviation
                }
                key={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
              />
            )}
            {daoConfig.resilienceStages && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.resilienceStages.anchorId}
                icon={BarChart}
                label={SECTIONS_CONSTANTS.resilienceStages.title}
                key={SECTIONS_CONSTANTS.resilienceStages.anchorId}
              />
            )}
            {daoConfig.tokenDistribution && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
                icon={ArrowRightLeft}
                label={SECTIONS_CONSTANTS.tokenDistribution.title}
                key={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
              />
            )}
            {daoConfig.dataTables && (
              <ButtonHeaderSidebar
                anchorId={SECTIONS_CONSTANTS.holdersAndDelegates.anchorId}
                icon={UserCheck}
                label={SECTIONS_CONSTANTS.holdersAndDelegates.title}
                key={SECTIONS_CONSTANTS.holdersAndDelegates.anchorId}
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
