"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HeaderDAOSidebarDropdown,
  ButtonHeaderSidebar,
} from "@/shared/components";
import { BarChart, Gauge, HeartIcon, Lightbulb, Activity } from "lucide-react";
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
      className={`fixed left-[68px] top-0 z-50 hidden h-screen w-[258px] border-r border-lightDark bg-darkest sm:block`}
    >
      <div className="flex h-full w-full flex-col">
        <HeaderDAOSidebarDropdown />
        <div className="flex h-full flex-col gap-3 p-4">
          {daoConfig.showSupport && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
              icon={HeartIcon}
              label={SECTIONS_CONSTANTS.showSupport.title}
            />
          )}
          {daoConfig.daoOverview && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.daoOverview.anchorId}
              icon={PieChart}
              label={SECTIONS_CONSTANTS.daoOverview.title}
            />
          )}
          {daoConfig.attackProfitability && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
              icon={Crosshair2Icon}
              label={SECTIONS_CONSTANTS.attackProfitability.title}
            />
          )}
          {daoConfig.riskAnalysis && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.riskAnalysis.anchorId}
              icon={Gauge}
              label={SECTIONS_CONSTANTS.riskAnalysis.title}
            />
          )}
          {daoConfig.governanceImplementation && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
              icon={Lightbulb}
              label={
                SECTIONS_CONSTANTS.governanceImplementation.titleAbbreviation
              }
            />
          )}
          {daoConfig.resilienceStages && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.resilienceStages.anchorId}
              icon={BarChart}
              label={SECTIONS_CONSTANTS.resilienceStages.title}
            />
          )}
          {daoConfig.tokenDistribution && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
              icon={ArrowRightLeft}
              label={SECTIONS_CONSTANTS.tokenDistribution.title}
            />
          )}
          {daoConfig.governanceActivity && (
            <ButtonHeaderSidebar
              anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
              icon={Activity}
              label={SECTIONS_CONSTANTS.governanceActivity.title}
            />
          )}
        </div>
      </div>
    </aside>
  );
};
