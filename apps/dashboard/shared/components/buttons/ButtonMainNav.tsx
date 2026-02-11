"use client";

import { cn } from "@/shared/utils/";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ButtonHTMLAttributes, ElementType } from "react";

interface ButtonMainNavProps extends ButtonHTMLAttributes<
  HTMLButtonElement | HTMLAnchorElement
> {
  page: string;
  icon: ElementType;
  label: string;
  className?: string;
  isGlobal?: boolean;
  isAction?: boolean;
}

export const ButtonMainNav = ({
  page,
  icon: Icon,
  label,
  className,
  isGlobal = false,
  isAction = false,
  onClick,
  ...props
}: ButtonMainNavProps) => {
  const pathname = usePathname();

  // Determine if this button should be highlighted as active
  const isActive = (() => {
    if (page === "/") {
      if (isGlobal) {
        // Panel (global) is active only on home page
        return pathname === "/";
      }
    }
    // Other pages are active when the pathname matches
    return pathname === `/${page}` || pathname === `/${page}/`;
  })();

  // Generate the target path (only for navigation buttons)
  let targetPath: string = "#";

  if (!isAction) {
    if (isGlobal) {
      // Global pages always use absolute path (e.g., /alerts)
      targetPath = page === "/" ? "/" : `/${page}`;
    }
  }

  const baseClassName = cn(
    "flex flex-col items-center justify-center gap-1 w-[56px] py-2 transition-colors",
    {
      "bg-primary": isActive,
      "hover:bg-surface-contrast": !isActive,
    },
    className,
  );

  const content = (
    <>
      <Icon
        className={cn("size-4 shrink-0 transition-colors", {
          "text-inverted": isActive,
          "text-secondary group-hover:text-primary": !isActive,
        })}
      />
      <p
        className={cn(
          "whitespace-pre-wrap text-center text-[12px] font-medium leading-[16px] transition-colors",
          {
            "text-inverted": isActive,
            "text-secondary group-hover:text-primary": !isActive,
          },
        )}
      >
        {label}
      </p>
    </>
  );

  // Render as button for action buttons
  if (isAction) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClassName, "group")}
        {...props}
      >
        {content}
      </button>
    );
  }

  // Render as Link for navigation buttons
  return (
    <Link
      href={targetPath}
      onClick={onClick}
      prefetch={true}
      {...props}
      className={cn(baseClassName, "group")}
    >
      {content}
    </Link>
  );
};
