"use client";

import { TheSectionLayout, SwitcherDate } from "@/components/atoms";
import { ArrowLeftRight } from "@/shared/icons";
import { GovernanceActivityTable } from "@/features/governance-activity";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";
import { SECTIONS_CONSTANTS } from "@/lib/constants";

export const GovernanceActivitySection = () => {
  const { setDays, days } = useGovernanceActivityContext();

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.governanceActivity.title}
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
          isSmall
        />
      }
      days={days}
      description={SECTIONS_CONSTANTS.governanceActivity.description}
      anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
    >
      <GovernanceActivityTable />
    </TheSectionLayout>
  );
};
