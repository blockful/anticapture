"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
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
import daoConstantsByDaoId from "@/lib/dao-constants";

export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoIdEnum);

  return (
    <BaseHeaderLayoutSidebar>
      {isValidDao && (
        <div className="flex w-full flex-col">
          <HeaderDAOSidebarDropdown />
          <div className="flex flex-col px-4 pb-4 pt-1 gap-3">
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.daoInfo.anchorId}
              icon={PieChartIcon}
              label={SECTIONS_CONSTANTS.daoInfo.title}
            />
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
              icon={CrossHairIcon}
              label={SECTIONS_CONSTANTS.attackProfitability.title}
            />
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
              icon={ArrowLeftRight}
              label={SECTIONS_CONSTANTS.tokenDistribution.title}
            />
            <ButtonHeaderDAOSidebar
              anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
              icon={ActivityIcon}
              label={SECTIONS_CONSTANTS.governanceActivity.title}
            />
            {!!daoConstantsByDaoId[daoId as DaoIdEnum]
              .governanceImplementation && (
              <ButtonHeaderDAOSidebar
                anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
                icon={Lightbulb}
                label={SECTIONS_CONSTANTS.governanceImplementation.title}
              />
            )}
          </div>
        </div>
      )}
      {!isDefault && !isValidDao && (
        <div className="flex flex-col items-center space-x-2">
          <h1 className="text-sm font-semibold text-white">404 Not Found</h1>
          <h1 className="text-sm font-semibold text-white">
            Please back to Home Page
          </h1>
        </div>
      )}
    </BaseHeaderLayoutSidebar>
  );
};
