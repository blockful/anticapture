"use client";

import { TheSectionLayout } from "@/shared/components";
import { PanelTable } from "@/features/panel/components";
import { BarChart3 } from "lucide-react";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";

export const PanelSection = () => {
  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.panel.title}
      icon={<BarChart3 className="section-layout-icon" />}
      anchorId={SECTIONS_CONSTANTS.panel.anchorId}
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
      isSwitchDateLinear
    >
      <PanelTable />
    </TheSectionLayout>
  );
};
