"use client";

import { useState } from "react";
import { SwitcherDate, TheSectionLayout } from "@/shared/components";
import { PanelTable } from "@/features/panel/components";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { BarChart3 } from "lucide-react";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";

export const PanelSection = () => {
  const [timeIntervalPanel, setTimeIntervalPanel] = useState<TimeInterval>(
    TimeInterval.ONE_YEAR,
  );

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.panel.title}
      icon={<BarChart3 className="section-layout-icon" />}
      switchDate={
        <SwitcherDate // TODO: Remove switcher in separate PR
          defaultValue={TimeInterval.ONE_YEAR}
          setTimeInterval={setTimeIntervalPanel}
        />
      }
      anchorId={SECTIONS_CONSTANTS.panel.anchorId}
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
      isSwitchDateLinear
    >
      <PanelTable days={timeIntervalPanel} />
    </TheSectionLayout>
  );
};
