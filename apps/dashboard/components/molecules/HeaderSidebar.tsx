"use client";

import {
  AnticaptureIcon,
  BarChartIcon,
  BaseHeaderLayoutSidebar,
} from "@/components/atoms";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import packageJson from "@/package.json";

export const HeaderSidebar = () => {
  return (
    <BaseHeaderLayoutSidebar>
      <div className="flex w-full flex-col items-start">
        <div className="flex w-full items-center justify-between border-b border-b-lightDark px-4 py-3">
          <div className="flex">
            <AnticaptureIcon />
          </div>
          <div className="flex">
          <p className="text-xs font-medium text-foreground">v{packageJson.version}</p>
          </div>
        </div>
        <div className="flex w-full p-4">
          <button
            className="flex w-full items-center gap-3 rounded-md bg-lightDark p-2"
            onClick={() => {
              const dashboardAnchorSection = document.getElementById(
                SECTIONS_CONSTANTS.dashboard.anchorId,
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
