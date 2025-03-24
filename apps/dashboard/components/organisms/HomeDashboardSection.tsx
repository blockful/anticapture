"use client";

import { useState } from "react";
import {
  BarChartIcon,
  SwitcherDate,
  TheSectionLayout,
} from "@/components/atoms";
import { DashboardTable } from "@/components/molecules";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
export const HomeDashboardSection = () => {
  const [timeIntervalDashboard, setTimeIntervalDashboard] =
    useState<TimeInterval>(TimeInterval.NINETY_DAYS);

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.dashboard.title}
      icon={<BarChartIcon className="h-6 w-6 text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setTimeIntervalDashboard}
        />
      }
      anchorId={SECTIONS_CONSTANTS.dashboard.anchorId}
    >
      <DashboardTable days={timeIntervalDashboard} />
    </TheSectionLayout>
  );
};
