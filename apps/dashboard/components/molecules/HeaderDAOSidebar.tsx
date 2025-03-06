"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import { cn } from "@/lib/client/utils";
import {
  daoInfoSectionAnchorID,
  governanceActivitySectionAnchorID,
  tokenDistributionSectionAnchorID,
} from "@/lib/client/constants";
import {
  ActivityIcon,
  ArrowLeftRight,
  BaseHeaderLayoutSidebar,
  PieChartIcon,
  HeaderDAOSidebarDropdown,
} from "@/components/atoms";
import { useSectionObserver } from "@/lib/hooks/useSectionObserver";

const enum HeaderNavItems {
  DAO_INFO = "DAO Info",
  TOKEN_DISTRIBUTION = "Token Distribution",
  GOVERNANCE_ACTIVITY = "Governance Activity",
}

export const HeaderDAOSidebar = () => {
  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: daoInfoSectionAnchorID,
  });
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoIdEnum);

  const isActive = (sectionId: string) => activeSection === sectionId;

  return (
    <BaseHeaderLayoutSidebar>
      {isValidDao && (
        <div className="flex w-full flex-col">
          <HeaderDAOSidebarDropdown />
          <div className="flex flex-col px-4 pb-4 pt-1">
            <button
              className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isActive(daoInfoSectionAnchorID) ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
              onClick={() => handleSectionClick(daoInfoSectionAnchorID)}
            >
              <PieChartIcon
                className={cn("text-foreground", {
                  "text-white": isActive(daoInfoSectionAnchorID),
                })}
              />
              <p className="text-sm font-medium text-white">
                {HeaderNavItems.DAO_INFO}
              </p>
            </button>
            <button
              className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isActive(tokenDistributionSectionAnchorID) ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
              onClick={() =>
                handleSectionClick(tokenDistributionSectionAnchorID)
              }
            >
              <ArrowLeftRight
                className={cn("text-foreground", {
                  "text-white": isActive(tokenDistributionSectionAnchorID),
                })}
              />
              <p className="text-sm font-medium text-white">
                {HeaderNavItems.TOKEN_DISTRIBUTION}
              </p>
            </button>
            <button
              className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isActive(governanceActivitySectionAnchorID) ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
              onClick={() =>
                handleSectionClick(governanceActivitySectionAnchorID)
              }
            >
              <ActivityIcon
                className={cn("text-foreground", {
                  "text-white": isActive(governanceActivitySectionAnchorID),
                })}
              />
              <p className="text-sm font-medium text-white">
                {HeaderNavItems.GOVERNANCE_ACTIVITY}
              </p>
            </button>
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
