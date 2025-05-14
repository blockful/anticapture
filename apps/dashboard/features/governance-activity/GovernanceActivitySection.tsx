"use client";

import { TheSectionLayout, SwitcherDate } from "@/shared/components";
import { ArrowLeftRight } from "@/shared/components/icons";
import { GovernanceActivityTable } from "@/features/governance-activity/components";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useGovernanceActivityContext } from "@/features/governance-activity/contexts/GovernanceActivityContext";
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
