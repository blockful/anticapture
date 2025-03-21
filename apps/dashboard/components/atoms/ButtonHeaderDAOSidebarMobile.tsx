"use client";

import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { useSectionObserver } from "@/lib/hooks/useSectionObserver";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export const ButtonHeaderDAOSidebarMobile = ({
  options,
}: {
  options: Array<{
    anchorId: string;
    title: string;
  }>;
}) => {
  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: SECTIONS_CONSTANTS.daoInfo.anchorId,
  });
  const isActive = (sectionId: string) => activeSection === sectionId;

  return (
    <Tabs
      defaultValue={SECTIONS_CONSTANTS.daoInfo.anchorId}
      className="w-fit min-w-full"
    >
      <TabsList className="flex">
        {options.map((option) => (
          <TabsTrigger
            className={cn(
              "gap-2 whitespace-nowrap px-2 py-3 text-xs font-medium text-foreground",
              isActive(option.anchorId) &&
                "border-b border-tangerine text-tangerine",
            )}
            key={option.anchorId}
            value={option.anchorId}
            onClick={() => handleSectionClick(option.anchorId)}
          >
            {option.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
