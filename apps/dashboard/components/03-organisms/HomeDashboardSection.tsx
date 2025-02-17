"use client";

import { useState } from "react";
import {
  BarChartIcon,
  SwitcherDate,
  TheSectionLayout,
} from "@/components/01-atoms";
import { DashboardTable } from "@/components/02-molecules";
import { dashboardSectionAnchorID } from "@/lib/client/constants";
import { TimeInterval } from "@/lib/enums/TimeInterval";
export const HomeDashboardSection = () => {
  const [timeIntervalDashboard, setTimeIntervalDashboard] =
    useState<TimeInterval>(TimeInterval.NINETY_DAYS);

  return (
    <TheSectionLayout
      title="Dashboard"
      icon={<BarChartIcon className="h-6 w-6 text-foreground" />}
      anchorId={dashboardSectionAnchorID}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setTimeIntervalDashboard}
        />
      }
    >
      <DashboardTable days={timeIntervalDashboard} />
    </TheSectionLayout>
  );
};
