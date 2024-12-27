"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  TimeInterval,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/01-atoms";
import { GovernanceActivityTable } from "@/components/02-molecules";

export const GovernanceActivitySection = () => {
  const [timeIntervalGovernanceActivity, setTimeIntervalGovernanceActivity] =
    useState<TimeInterval>(TimeInterval.SEVEN_DAYS);

  return (
    <TheSectionLayout
      title="Governance activity"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate setTimeInterval={setTimeIntervalGovernanceActivity} />
      }
      description="Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current"
    >
      <GovernanceActivityTable timeInterval={timeIntervalGovernanceActivity} />
    </TheSectionLayout>
  );
};
