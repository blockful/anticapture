"use client";

import {
  PanelTable,
  DelegatedSupplyHistory,
  DaoProtectionLevels,
  TreasuryMonitoring,
} from "@/features/panel/components";

export const PanelSection = () => {
  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      <div className="grid grid-cols-3 gap-4">
        <DaoProtectionLevels />
        <TreasuryMonitoring />
        <DelegatedSupplyHistory />
      </div>

      <PanelTable />
    </div>
  );
};
