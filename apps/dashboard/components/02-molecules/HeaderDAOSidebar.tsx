"use client";

import {
  ArrowLeftRight,
  BaseHeaderLayoutSidebar,
  UniswapIcon,
} from "@/components/01-atoms";
import { usePathname } from "next/navigation";
import { DaoId, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import {
  daoInfoSectionAnchorID,
  governanceActivitySectionAnchorID,
  tokenDistributionSectionAnchorID,
} from "@/lib/client/constants";
import { PieChartIcon } from "../01-atoms/icons/PieChartIcon";
import { ActivityIcon } from "../01-atoms/icons/ActivityIcon";

export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";

  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoId);

  return (
    <BaseHeaderLayoutSidebar>
      {isValidDao && (
        <div className="flex w-full flex-col space-x-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-[6px] border border-middleDark bg-lightDark p-1.5">
              <UniswapIcon className="h-5 w-5 text-[#FC72FF]" />
            </div>
            <h1 className="text-sm font-semibold text-white">
              Uniswap GovRisk
            </h1>
          </div>
          <div className="flex flex-col">
            <button
              className="flex w-full items-center gap-3 rounded-md bg-lightDark p-2"
              onClick={() => {
                const daoInfoAnchorSection = document.getElementById(
                  daoInfoSectionAnchorID,
                );

                daoInfoAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <PieChartIcon className="text-white" />
              <p className="text-sm font-medium text-white">DAO Info</p>
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md bg-lightDark p-2"
              onClick={() => {
                const tokenDistributionAnchorSection = document.getElementById(
                  tokenDistributionSectionAnchorID,
                );

                tokenDistributionAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <ArrowLeftRight className="text-white" />
              <p className="text-sm font-medium text-white">
                Token Distribution
              </p>
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md bg-lightDark p-2"
              onClick={() => {
                const governanceActivityAnchorSection = document.getElementById(
                  governanceActivitySectionAnchorID,
                );

                governanceActivityAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <ActivityIcon className="text-white" />
              <p className="text-sm font-medium text-white">
                Governance activity
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
