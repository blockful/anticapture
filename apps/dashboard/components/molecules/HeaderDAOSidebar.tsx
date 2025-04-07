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
          {/* Basic DAO info shown for all stages except EMPTY_ANALYSIS */}
          {daoConfig.daoInfo?.enabled && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.daoInfo.anchorId}
              icon={PieChartIcon}
              label={SECTIONS_CONSTANTS.daoInfo.title}
            />
          )}

          {/* Attack profitability shown for all stages except EMPTY_ANALYSIS */}
          {daoConfig.attackProfitability?.enabled && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
              icon={CrossHairIcon}
              label={SECTIONS_CONSTANTS.attackProfitability.title}
            />
          )}

          {/* Governance implementation only shown for FULL stage if available */}
          {daoConfig.governanceImplementation?.enabled && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
              icon={Lightbulb}
              label={SECTIONS_CONSTANTS.governanceImplementation.title}
            />
          )}

          {/* Token distribution shown for all stages except EMPTY_ANALYSIS */}
          {daoConfig.tokenDistribution?.enabled && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
              icon={ArrowLeftRight}
              label={SECTIONS_CONSTANTS.tokenDistribution.title}
            />
          )}

          {/* Governance activity only shown for FULL stage unless explicitly removed */}
          {daoConfig.governanceActivity?.enabled && (
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
              icon={ActivityIcon}
              label={SECTIONS_CONSTANTS.governanceActivity.title}
            />
          )}

          {/* Show support section only shown for election stage */}
          {daoConfig.showSupport?.enabled && (
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
