"use client";

import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { useSectionObserver } from "@/lib/hooks/useSectionObserver";

export const ButtonHeaderDAOSidebar = ({
  anchorId,
  icon: Icon,
  label,
}: {
  anchorId: string;
  icon: React.ElementType;
  label: string;
}) => {
  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: SECTIONS_CONSTANTS.daoOverview.anchorId,
  });
  const isActive = (sectionId: string) => activeSection === sectionId;

  return (
    <button
      className={cn(
        `flex w-full items-center gap-3 rounded-md border border-transparent p-2`,
        {
          "cursor-default bg-white": isActive(anchorId),
          "hover:border-lightDark hover:bg-transparent": !isActive(anchorId),
        },
      )}
      onClick={() => handleSectionClick(anchorId)}
    >
      <Icon
        className={cn("h-5 w-5", {
          "text-darkest": isActive(anchorId),
          "text-foreground": !isActive(anchorId),
        })}
      />
      <p
        className={cn("text-sm font-medium", {
          "text-darkest": isActive(anchorId),
          "text-foreground": !isActive(anchorId),
        })}
      >
        {label}
      </p>
    </button>
  );
};
