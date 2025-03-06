"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/atoms";
import { GovernanceActivityTable } from "@/components/molecules";
import { governanceActivitySectionAnchorID } from "@/lib/client/constants";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";

export const GovernanceActivitySection = () => {
  const { setDays } = useGovernanceActivityContext();

  return (
    <TheSectionLayout
      title="Governance activity"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description="Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current"
      anchorId={governanceActivitySectionAnchorID}
    >
      <GovernanceActivityTable />
    </TheSectionLayout>
  );
};
