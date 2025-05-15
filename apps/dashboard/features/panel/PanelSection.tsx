"use client";

import { useState } from "react";
import { SwitcherDate, TheSectionLayout } from "@/shared/components";
import { PanelTable } from "@/features/panel/components";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { SECTIONS_CONSTANTS } from "@/shared/constants/lib-constants";
import { BarChart3 } from "lucide-react";

export const PanelSection = () => {
  const [timeIntervalPanel, setTimeIntervalPanel] = useState<TimeInterval>(
    TimeInterval.ONE_YEAR,
  );

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.panel.title}
      icon={<BarChart3 className="section-layout-icon" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.ONE_YEAR}
          setTimeInterval={setTimeIntervalPanel}
        />
      }
      anchorId={SECTIONS_CONSTANTS.panel.anchorId}
      className="!mt-[56px] !bg-darkest sm:!mt-0"
      isSwitchDateLinear
    >
      <PanelTable days={timeIntervalPanel} />
    </TheSectionLayout>
  );
};
