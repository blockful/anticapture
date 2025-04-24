"use client";

import {
  ArrowLeftRight,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/atoms";
import { GovernanceActivityTable } from "@/components/molecules";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";
import { SECTIONS_CONSTANTS } from "@/lib/constants";

export const GovernanceActivitySection = () => {
  const { setDays } = useGovernanceActivityContext();

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.governanceActivity.title}
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.SEVEN_DAYS}
          setTimeInterval={setDays}
        />
      }
      description={SECTIONS_CONSTANTS.governanceActivity.description}
      anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
    >
      <GovernanceActivityTable />
    </TheSectionLayout>
  );
};
