"use client";

import { DrawerCloseButton } from "@/shared/components/design-system/drawer/components/DrawerCloseButton";
import { DrawerSubtitle } from "@/shared/components/design-system/drawer/components/DrawerSubtitle";
import { DrawerTabs } from "@/shared/components/design-system/drawer/components/DrawerTabs";
import { DrawerTitle } from "@/shared/components/design-system/drawer/components/DrawerTitle";
import type { DrawerHeaderProps } from "@/shared/components/design-system/drawer/types";

export const DrawerHeader = ({
  subtitle,
  title,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  action,
}: DrawerHeaderProps) => {
  return (
    <div className="bg-surface-contrast w-full shrink-0">
      <div className="bg-surface-contrast flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          {subtitle && <DrawerSubtitle>{subtitle}</DrawerSubtitle>}
          <DrawerCloseButton onClick={onClose} />
        </div>
        <div className="flex items-start justify-between gap-2">
          <DrawerTitle>{title}</DrawerTitle>
          {action && <div className="shrink-0 self-start">{action}</div>}
        </div>
      </div>
      {tabs && activeTab && onTabChange && (
        <DrawerTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};
