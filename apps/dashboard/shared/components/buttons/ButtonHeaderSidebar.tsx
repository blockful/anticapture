"use client";

import { cn } from "@/shared/utils/";
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
          "hover:border-light-dark hover:bg-light-dark": !isActive(anchorId),
        },
        className,
      )}
      onClick={() => handleSectionClick(anchorId)}
      {...props}
    >
      <Icon
        className={cn("size-4", {
          "text-darkest": isActive(anchorId),
          "text-foreground group-hover:text-white": !isActive(anchorId),
        })}
      />
      <p
        className={cn("", {
          "text-darkest": isActive(anchorId),
          "text-foreground group-hover:text-white": !isActive(anchorId),
        })}
      >
        {label}
      </p>
    </button>
  );
};
