"use client";

import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { cn } from "@/shared/utils";
import type { DrawerTabsProps } from "@/shared/components/design-system/drawer/types";

export const DrawerTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: DrawerTabsProps) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="w-fit min-w-full"
    >
      <TabsList className="group flex border-b border-b-white/10 pl-4">
        {tabs.map((tab) => (
          <TabsTrigger
            className={cn(
              "text-secondary relative cursor-pointer gap-2 whitespace-nowrap px-2 py-2 text-xs font-medium",
              "data-[state=active]:text-link",
              "after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-transparent after:content-['']",
              "data-[state=active]:after:bg-surface-solid-brand",
            )}
            key={tab.id}
            value={tab.id}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
