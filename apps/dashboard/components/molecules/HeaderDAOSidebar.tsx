"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum, ALL_DAOS } from "@/lib/types/daos";
import {
  ActivityIcon,
  ArrowLeftRight,
  BaseHeaderLayoutSidebar,
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
  const isValidDao = daoId && ALL_DAOS.includes(daoId as DaoIdEnum);

  if (!isValidDao) {
    return (
      <BaseHeaderLayoutSidebar>
        {!isDefault && (
          <div className="flex flex-col items-center space-x-2">
            <h1 className="text-sm font-semibold text-white">404 Not Found</h1>
            <h1 className="text-sm font-semibold text-white">
              Please back to Home Page
            </h1>
          </div>
        )}
      </BaseHeaderLayoutSidebar>
    );
  }

  const daoConfig = daoConfigByDaoId[daoId as DaoIdEnum];

  if (daoConfig.disableDaoPage) {
    return null;
  }

  return (
    <BaseHeaderLayoutSidebar>
      <div className="flex w-full flex-col">
        <HeaderDAOSidebarDropdown />
        <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
          {daoConfig.daoInfo && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.daoInfo.anchorId}
              icon={PieChartIcon}
              label={SECTIONS_CONSTANTS.daoInfo.title}
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
          {daoConfig.showSupport && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
              icon={ActivityIcon}
              label={SECTIONS_CONSTANTS.showSupport.title}
            />
          )}
        </div>
      </div>
    </BaseHeaderLayoutSidebar>
  );
};
