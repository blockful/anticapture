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
}: DrawerHeaderProps) => {
  return (
    <div className="bg-surface-contrast w-full shrink-0">
      <div className="bg-surface-contrast flex justify-between p-4">
        <div className="flex flex-col gap-1">
          <DrawerSubtitle>{subtitle}</DrawerSubtitle>
          <DrawerTitle>{title}</DrawerTitle>
        </div>
        <DrawerCloseButton onClick={onClose} />
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
