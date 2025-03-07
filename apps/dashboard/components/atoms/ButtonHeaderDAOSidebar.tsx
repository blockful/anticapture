"use client";

import { daoInfoSectionAnchorID } from "@/lib/client/constants";
import { cn } from "@/lib/client/utils";
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
    initialSection: daoInfoSectionAnchorID,
  });
  const isActive = (sectionId: string) => activeSection === sectionId;

  return (
    <button
      className={`flex w-full items-center gap-3 rounded-md border border-transparent p-2 ${isActive(anchorId) ? "cursor-default bg-lightDark" : "hover:border-lightDark hover:bg-transparent"}`}
      onClick={() => handleSectionClick(anchorId)}
    >
      <Icon
        className={cn("h-5 w-5", {
          "text-white": isActive(anchorId),
          "text-foreground": !isActive(anchorId),
        })}
      />
      <p className="text-sm font-medium text-white">{label}</p>
    </button>
  );
};
