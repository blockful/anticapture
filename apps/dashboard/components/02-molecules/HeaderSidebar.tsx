"use client";

import {
  AnticaptureIcon,
  BarChartIcon,
  BaseHeaderLayoutSidebar,
} from "@/components/01-atoms";
import { dashboardSectionAnchorID } from "@/lib/client/constants";

export const HeaderSidebar = () => {
  return (
    <BaseHeaderLayoutSidebar>
      <div className="flex w-full flex-col items-start">
        <div className="flex w-full items-center justify-between border-b border-b-lightDark px-4 py-3">
          <div className="flex">
            <AnticaptureIcon />
          </div>
          <div className="flex">
            <p className="text-xs font-medium text-foreground">v1.0</p>
          </div>
        </div>
        <div className="flex w-full p-4">
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
      </div>
    </BaseHeaderLayoutSidebar>
  );
};
