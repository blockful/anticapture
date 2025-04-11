"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import {
  ActivityIcon,
  ArrowLeftRight,
  PieChartIcon,
  HeaderDAOSidebarDropdown,
  ButtonHeaderDAOSidebar,
  CrossHairIcon,
} from "@/components/atoms";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Lightbulb } from "lucide-react";
import daoConfigByDaoId from "@/lib/dao-config";

export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const daoConfig = daoConfigByDaoId[daoId as DaoIdEnum];

  if (daoConfig.disableDaoPage) {
    return null;
  }

  return (
    <aside className="fixed left-[72px] top-0 z-40 hidden h-screen w-[258px] border-r border-lightDark sm:block">
      <div className="flex h-full w-full flex-col">
        <HeaderDAOSidebarDropdown />
        <div className="flex h-full flex-col gap-3 p-4">
          {daoConfig.showSupport && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
              icon={ActivityIcon}
              label={SECTIONS_CONSTANTS.showSupport.title}
            />
          )}
          {daoConfig.daoOverview && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.daoOverview.anchorId}
              icon={PieChartIcon}
              label={SECTIONS_CONSTANTS.daoOverview.title}
            />
          )}
          {daoConfig.attackProfitability && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
              icon={CrossHairIcon}
              label={SECTIONS_CONSTANTS.attackProfitability.title}
            />
          )}
          {daoConfig.governanceImplementation && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
              icon={Lightbulb}
              label={SECTIONS_CONSTANTS.governanceImplementation.title}
            />
          )}
          {daoConfig.tokenDistribution && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
              icon={ArrowLeftRight}
              label={SECTIONS_CONSTANTS.tokenDistribution.title}
            />
          )}
          {daoConfig.governanceActivity && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
              icon={ActivityIcon}
              label={SECTIONS_CONSTANTS.governanceActivity.title}
            />
          )}
        </div>
      </div>
    </aside>
  );
};
