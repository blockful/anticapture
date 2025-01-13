"use client";

import {
  BarChartIcon,
  BaseHeaderLayoutSidebar,
  HeaderIcon,
} from "@/components/01-atoms";
import { dashboardSectionAnchorID } from "@/lib/client/constants";

export const HeaderSidebar = () => {
  return (
    <BaseHeaderLayoutSidebar>
      <div className="flex w-full flex-col items-start space-x-2 space-y-3">
        <div className="flex items-center justify-center">
          <HeaderIcon />
          <h1 className="text-sm font-semibold text-foreground">
            Governance Security
          </h1>
        </div>
        <button
          className="flex w-full items-center gap-3 rounded-md bg-lightDark p-2"
          onClick={() => {
            const dashboardAnchorSection = document.getElementById(
              dashboardSectionAnchorID,
            );

            dashboardAnchorSection?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          <BarChartIcon className="text-white" />
          <p className="text-sm font-medium text-white">Dashboard</p>
        </button>
      </div>
    </BaseHeaderLayoutSidebar>
  );
};
