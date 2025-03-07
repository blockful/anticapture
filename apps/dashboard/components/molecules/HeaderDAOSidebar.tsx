"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import {
  daoInfoSectionAnchorID,
  extractableValueSectionAnchorID,
  governanceActivitySectionAnchorID,
  tokenDistributionSectionAnchorID,
} from "@/lib/client/constants";
import {
  ActivityIcon,
  ArrowLeftRight,
  BaseHeaderLayoutSidebar,
  PieChartIcon,
  HeaderDAOSidebarDropdown,
  ButtonHeaderDAOSidebar,
  CrossHairIcon,
} from "@/components/atoms";

const enum HeaderNavItems {
  DAO_INFO = "DAO Info",
  EXTRACTABLE_VALUE = "Extractable Value",
  TOKEN_DISTRIBUTION = "Token Distribution",
  GOVERNANCE_ACTIVITY = "Governance Activity",
}

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
          <div className="flex flex-col px-4 pb-4 pt-1">
            <ButtonHeaderDAOSidebar
              anchorId={daoInfoSectionAnchorID}
              icon={PieChartIcon}
              label={HeaderNavItems.DAO_INFO}
            />
            <ButtonHeaderDAOSidebar
              anchorId={extractableValueSectionAnchorID}
              icon={CrossHairIcon}
              label={HeaderNavItems.EXTRACTABLE_VALUE}
            />
            <ButtonHeaderDAOSidebar
              anchorId={tokenDistributionSectionAnchorID}
              icon={ArrowLeftRight}
              label={HeaderNavItems.TOKEN_DISTRIBUTION}
            />
            <ButtonHeaderDAOSidebar
              anchorId={governanceActivitySectionAnchorID}
              icon={ActivityIcon}
              label={HeaderNavItems.GOVERNANCE_ACTIVITY}
            />
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
