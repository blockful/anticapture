"use client";

import { Crosshair2Icon } from "@radix-ui/react-icons";
import {
  BarChart,
  Building2,
  Landmark,
  UserCheck,
  ArrowRightLeft,
  PieChart,
  Newspaper,
  Bomb,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  HeaderDAOSidebarDropdown,
  ButtonHeaderSidebar,
} from "@/shared/components";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/";

export const HeaderDAOSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const daoConfig = daoConfigByDaoId[daoId as DaoIdEnum];

  if (!daoConfig || daoConfig.disableDaoPage) {
    return null;
  }

  return (
    <aside
      className={cn(
        "bg-surface-background border-light-dark relative z-50 h-screen border-r transition-all duration-300 lg:block",
        isCollapsed ? "w-[68px] overflow-visible" : "w-[258px]",
      )}
    >
      <div className="z-50 flex h-full w-full flex-col">
        <HeaderDAOSidebarDropdown
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-[12px] p-2">
            {daoConfig.daoOverview && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.daoOverview.page}
                icon={PieChart}
                label={PAGES_CONSTANTS.daoOverview.title}
                key={PAGES_CONSTANTS.daoOverview.title}
                isCollapsed={isCollapsed}
              />
            )}
            {daoConfig.attackProfitability &&
              daoConfig.attackProfitability.supportsLiquidTreasuryCall && (
                <ButtonHeaderSidebar
                  page={PAGES_CONSTANTS.attackProfitability.page}
                  icon={Crosshair2Icon}
                  label={PAGES_CONSTANTS.attackProfitability.title}
                  key={PAGES_CONSTANTS.attackProfitability.title}
                  isCollapsed={isCollapsed}
                />
              )}
            {daoConfig.resilienceStages && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.resilienceStages.page}
                icon={BarChart}
                label={PAGES_CONSTANTS.resilienceStages.title}
                key={PAGES_CONSTANTS.resilienceStages.title}
                isCollapsed={isCollapsed}
              />
            )}
            {daoConfig.attackExposure && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.attackExposure.page}
                icon={Bomb}
                label={PAGES_CONSTANTS.attackExposure.title}
                key={PAGES_CONSTANTS.attackExposure.title}
                isCollapsed={isCollapsed}
              />
            )}
            {daoConfig.tokenDistribution && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.tokenDistribution.page}
                icon={ArrowRightLeft}
                label={PAGES_CONSTANTS.tokenDistribution.title}
                key={PAGES_CONSTANTS.tokenDistribution.title}
                isCollapsed={isCollapsed}
              />
            )}
            {daoConfig.dataTables && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.holdersAndDelegates.page}
                icon={UserCheck}
                label={PAGES_CONSTANTS.holdersAndDelegates.title}
                key={PAGES_CONSTANTS.holdersAndDelegates.title}
                isCollapsed={isCollapsed}
              />
            )}

            {daoConfig.governancePage && (
              <ButtonHeaderSidebar
                page={"governance"}
                icon={Landmark}
                label="Governance"
                key="Governance"
                isCollapsed={isCollapsed}
              />
            )}

            {daoConfig.serviceProviders && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.serviceProviders.page}
                icon={Building2}
                label={PAGES_CONSTANTS.serviceProviders.title}
                key={PAGES_CONSTANTS.serviceProviders.title}
                isCollapsed={isCollapsed}
              />
            )}

            <ButtonHeaderSidebar
              page={PAGES_CONSTANTS.activityFeed.page}
              icon={Newspaper}
              label={PAGES_CONSTANTS.activityFeed.title}
              key={PAGES_CONSTANTS.activityFeed.title}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
