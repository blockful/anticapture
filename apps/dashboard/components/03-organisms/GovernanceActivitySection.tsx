"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/01-atoms";
import { GovernanceActivityTable } from "@/components/02-molecules";
import { governanceActivitySectionAnchorID } from "@/lib/client/constants";
import { TimeInterval } from "@/lib/enums/TimeInterval";

export const GovernanceActivitySection = () => {
  const [timeIntervalGovernanceActivity, setTimeIntervalGovernanceActivity] =
    useState<TimeInterval>(TimeInterval.NINETY_DAYS);

  return (
    <TheSectionLayout
      title="Governance activity"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate defaultValue={TimeInterval.NINETY_DAYS} setTimeInterval={setTimeIntervalGovernanceActivity} />
      }
      description="Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current"
      anchorId={governanceActivitySectionAnchorID}
    >
      <GovernanceActivityTable days={timeIntervalGovernanceActivity} />
    </TheSectionLayout>
  );
};
