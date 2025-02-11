"use client";

import { useState } from "react";
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
} from "@/components/01-atoms";

const enum HeaderNavItems {
  DAO_INFO = "DAO Info",
  TOKEN_DISTRIBUTION = "Token Distribution",
  GOVERNANCE_ACTIVITY = "Governance Activity",
}

export const HeaderDAOSidebar = () => {
  const [isNavSelected, setIsNavSelected] = useState<HeaderNavItems>(
    HeaderNavItems.DAO_INFO,
  );
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
            <button
              className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isNavSelected === HeaderNavItems.DAO_INFO ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
              onClick={() => {
                const daoInfoAnchorSection = document.getElementById(
                  daoInfoSectionAnchorID,
                );

                daoInfoAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
                setIsNavSelected(HeaderNavItems.DAO_INFO);
              }}
            >
              <PieChartIcon
                className={cn("text-foreground", {
                  "text-white": isNavSelected === HeaderNavItems.DAO_INFO,
                })}
              />
              <p className="text-sm font-medium text-white">
                {HeaderNavItems.DAO_INFO}
              </p>
            </button>
            <button
              className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isNavSelected === HeaderNavItems.TOKEN_DISTRIBUTION ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
              onClick={() => {
                const tokenDistributionAnchorSection = document.getElementById(
                  tokenDistributionSectionAnchorID,
                );

                tokenDistributionAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
                setIsNavSelected(HeaderNavItems.TOKEN_DISTRIBUTION);
              }}
            >
              <ArrowLeftRight
                className={cn("text-foreground", {
                  "text-white":
                    isNavSelected === HeaderNavItems.TOKEN_DISTRIBUTION,
                })}
              />
              <p className="text-sm font-medium text-white">
                {HeaderNavItems.TOKEN_DISTRIBUTION}
              </p>
            </button>
            <button
              className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isNavSelected === HeaderNavItems.GOVERNANCE_ACTIVITY ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
              onClick={() => {
                const governanceActivityAnchorSection = document.getElementById(
                  governanceActivitySectionAnchorID,
                );

                governanceActivityAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
                setIsNavSelected(HeaderNavItems.GOVERNANCE_ACTIVITY);
              }}
            >
              <ActivityIcon
                className={cn("text-foreground", {
                  "text-white":
                    isNavSelected === HeaderNavItems.GOVERNANCE_ACTIVITY,
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
