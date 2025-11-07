"use client";

import { TheSectionLayout } from "@/shared/components";
import {
  PanelTable,
  DelegatedSupplyHistory,
  DaoProtectionLevels,
  TreasuryMonitoring,
} from "@/features/panel/components";
import { BarChart3 } from "lucide-react";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

export const PanelSection = () => {
  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.panel.title}
      icon={<BarChart3 className="section-layout-icon" />}
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
      isSwitchDateLinear
    >
      <div className="grid grid-cols-3 gap-4">
        <DaoProtectionLevels />
        <TreasuryMonitoring />
        <DelegatedSupplyHistory />
      </div>

      <PanelTable />
    </TheSectionLayout>
  );
};
