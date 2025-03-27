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
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description={SECTIONS_CONSTANTS.governanceActivity.description}
      anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
      className="border-b-2 border-b-white/10 px-4 py-8 sm:px-0 sm:py-0"
    >
      <GovernanceActivityTable />
    </TheSectionLayout>
  );
};
