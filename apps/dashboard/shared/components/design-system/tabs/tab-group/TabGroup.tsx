import { Tab } from "@/shared/components/design-system/tabs/tab/Tab";
import type { TabGroupProps } from "@/shared/components/design-system/tabs/types";
import { cn } from "@/shared/utils/cn";

export const TabGroup = ({
  tabs,
  activeTab,
  size = "sm",
  onTabChange,
  className,
}: TabGroupProps) => {
  return (
    <div
      role="tablist"
      className={cn(
        // Base/layout — horizontal row, gap-xsm (8px) from Figma token
        "flex items-center gap-2",
        // Bottom border — borders/default token
        "border-border-default border-b",
        // Allow overrides
        className,
      )}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
          isActive={activeTab === tab.value}
          size={size}
          badge={tab.badge}
          onClick={() => onTabChange?.(tab.value)}
        />
      ))}
    </div>
  );
};
