"use client";

import { cn } from "@/shared/utils/utils";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { useSectionObserver } from "@/shared/hooks";
import { ButtonHTMLAttributes, useEffect } from "react";
import { ElementType } from "react";

interface ButtonHeaderSidebar extends ButtonHTMLAttributes<HTMLButtonElement> {
  anchorId: string;
  icon: ElementType;
  label: string;
  className?: string;
}
export const ButtonHeaderSidebar = ({
  anchorId,
  icon: Icon,
  label,
  className,
  ...props
}: ButtonHeaderSidebar) => {
  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: SECTIONS_CONSTANTS.daoOverview.anchorId,
  });
  const isActive = (sectionId: string) => activeSection === sectionId;

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

  return (
    <button
      className={cn(
        `group flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-sm font-medium`,
        {
          "cursor-default bg-white": isActive(anchorId),
          "hover:border-lightDark hover:bg-lightDark": !isActive(anchorId),
        },
        className,
      )}
      onClick={() => handleSectionClick(anchorId)}
      {...props}
    >
      <Icon
        className={cn("size-5", {
          "text-darkest": isActive(anchorId),
          "text-foreground group-hover:text-[#FAFAFA]": !isActive(anchorId),
        })}
      />
      <p
        className={cn("", {
          "text-darkest": isActive(anchorId),
          "text-foreground group-hover:text-[#FAFAFA]": !isActive(anchorId),
        })}
      >
        {label}
      </p>
    </button>
  );
};
