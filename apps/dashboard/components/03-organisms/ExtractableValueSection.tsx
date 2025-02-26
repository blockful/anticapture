"use client";

import {
  TheSectionLayout,
  SwitcherDate,
  CrossHairIcon,
} from "@/components/01-atoms";
import { extractableValueSectionAnchorID } from "@/lib/client/constants";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useGovernanceActivityContext } from "@/components/contexts/GovernanceActivityContext";

export const ExtractableValueSection = () => {
  const { setDays } = useGovernanceActivityContext();

  return (
    <TheSectionLayout
      title="Extractable Value"
      icon={<CrossHairIcon className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description="Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current"
      anchorId={extractableValueSectionAnchorID}
    >
      <></>
    </TheSectionLayout>
  );
};
