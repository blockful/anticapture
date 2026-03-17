import { PillTab } from "@/shared/components/design-system/tabs/pill-tab/PillTab";
import type { PillTabGroupProps } from "@/shared/components/design-system/tabs/types";
import { cn } from "@/shared/utils/cn";

export const PillTabGroup = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: PillTabGroupProps) => {
  return (
    <div
      role="tablist"
      className={cn(
        // Base/layout — horizontal row, gap-2 (8px) from Figma token
        "flex items-center gap-2",
        className,
      )}
    >
      {tabs.map((tab) => (
        <PillTab
          key={tab.value}
          label={tab.label}
          isActive={activeTab === tab.value}
          onClick={() => onTabChange?.(tab.value)}
        />
      ))}
    </div>
  );
};
