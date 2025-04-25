"use client";

import { useState } from "react";
import {
  BarChartIcon,
  SwitcherDate,
  TheSectionLayout,
} from "@/components/atoms";
import { PanelTable } from "@/components/molecules";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { SECTIONS_CONSTANTS } from "@/lib/constants";

export const PanelSection = () => {
  const [timeIntervalPanel, setTimeIntervalPanel] = useState<TimeInterval>(
    TimeInterval.NINETY_DAYS,
  );

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.panel.title}
      icon={<BarChartIcon className="size-6 text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setTimeIntervalPanel}
        />
      }
      anchorId={SECTIONS_CONSTANTS.panel.anchorId}
      className="!bg-darkest"
      isSwitchDateLinear
    >
      <PanelTable days={timeIntervalPanel} />
    </TheSectionLayout>
  );
};
