"use client";

import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { useSectionObserver } from "@/lib/hooks/useSectionObserver";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export const ButtonHeaderDAOSidebarMobile = ({
  options,
}: {
  options: {
    anchorId: string;
    title: string;
    enabled?: boolean;
  }[];
  headerOffset?: number;
}) => {
  const MOBILE_DEFAULT_OFFSET = 120;

  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: SECTIONS_CONSTANTS.daoInfo.anchorId,
    headerOffset: MOBILE_DEFAULT_OFFSET,
    useWindowScrollTo: true,
  });

  return (
    <Tabs
      defaultValue={SECTIONS_CONSTANTS.daoInfo.anchorId}
      value={activeSection || SECTIONS_CONSTANTS.daoInfo.anchorId}
      onValueChange={(value) => handleSectionClick(value)}
      className="w-fit min-w-full"
    >
      <TabsList
        className={cn(
          "group flex border-b border-t border-b-white/10 border-t-white/10 pl-4",
        )}
      >
        {options.map(
          (option) =>
            option.enabled && (
              <TabsTrigger
                className={cn(
                  "relative gap-2 whitespace-nowrap px-2 py-3 text-xs font-medium text-foreground",
                  "data-[state=active]:text-tangerine",
                  "after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-transparent after:content-['']",
                  "data-[state=active]:after:bg-tangerine",
                )}
                key={option.anchorId}
                value={option.anchorId}
              >
                {option.title}
              </TabsTrigger>
            ),
        )}
      </TabsList>
    </Tabs>
  );
};
