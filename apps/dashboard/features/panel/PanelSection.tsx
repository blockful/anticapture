"use client";

import { useState } from "react";
import { SwitcherDate, TheSectionLayout } from "@/shared/components";
import { PanelTable } from "@/features/panel/components";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { BarChart3 } from "lucide-react";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

export const PanelSection = () => {
  const [timeIntervalPanel, setTimeIntervalPanel] = useState<TimeInterval>(
    TimeInterval.ONE_YEAR,
  );

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.panel.title}
      icon={<BarChart3 className="section-layout-icon" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.ONE_YEAR}
          setTimeInterval={setTimeIntervalPanel}
        />
      }
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
      isSwitchDateLinear
    >
      <PanelTable days={timeIntervalPanel} />
    </TheSectionLayout>
  );
};
