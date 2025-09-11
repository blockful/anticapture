"use client";

import { cn } from "@/shared/utils/";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { useSectionObserver } from "@/shared/hooks";
import { ButtonHTMLAttributes, useEffect } from "react";
import { ElementType } from "react";
import { Button } from "@/shared/components";

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
    <Button
      variant="ghost"
      className={cn(
        `group w-full justify-start`,
        {
          "cursor-default bg-white hover:bg-white": isActive(anchorId),
        },
        className,
      )}
      onClick={() => handleSectionClick(anchorId)}
      {...props}
    >
      <Icon
        className={cn("size-4", {
          "text-inverted": isActive(anchorId),
          "text-secondary group-hover:text-primary": !isActive(anchorId),
        })}
      />
      <p
        className={cn("", {
          "text-inverted": isActive(anchorId),
          "text-secondary group-hover:text-primary": !isActive(anchorId),
        })}
      >
        {label}
      </p>
    </Button>
  );
};
