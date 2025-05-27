"use client";

import { cn } from "@/shared/utils/";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { useSectionObserver } from "@/shared/hooks";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useEffect } from "react";

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
  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: SECTIONS_CONSTANTS.daoOverview.anchorId,
  });

  useEffect(() => {
    const sectionId = sessionStorage.getItem("scrollToSection");
    if (sectionId) {
      const el = document.getElementById(sectionId);
      handleSectionClick(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        sessionStorage.removeItem("scrollToSection");
      }
    }
  }, [handleSectionClick]);

  const handleTabChange = (value: string) => {
    const section = document.getElementById(value);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    handleSectionClick(value);
  };

  return (
    <Tabs
      defaultValue={SECTIONS_CONSTANTS.daoOverview.anchorId}
      value={activeSection || SECTIONS_CONSTANTS.daoOverview.anchorId}
      onValueChange={handleTabChange}
      className="w-fit min-w-full"
    >
      <TabsList className="group flex border-b border-b-white/10 pl-4">
        {options.map(
          (option) =>
            option.enabled && (
              <TabsTrigger
                className={cn(
                  "text-secondary relative cursor-pointer gap-2 px-2 py-3 text-xs font-medium whitespace-nowrap",
                  "data-[state=active]:text-tangerine",
                  "after:absolute after:right-0 after:-bottom-px after:left-0 after:h-px after:bg-transparent after:content-['']",
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
