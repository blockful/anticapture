"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ButtonHTMLAttributes, ElementType } from "react";

import { cn } from "@/shared/utils/";

interface ButtonHeaderSidebarProps extends ButtonHTMLAttributes<
  HTMLButtonElement | HTMLAnchorElement
> {
  page: string;
  icon: ElementType;
  label: string;
  className?: string;
  isGlobal?: boolean;
  isAction?: boolean;
  isCollapsed?: boolean;
}

export const ButtonHeaderSidebar = ({
  page,
  icon: Icon,
  label,
  className,
  isGlobal = false,
  isAction = false,
  isCollapsed = false,
  onClick,
  ...props
}: ButtonHeaderSidebarProps) => {
  const params = useParams();
  const pathname = usePathname();

  const daoId = params?.daoId as string;
  const currentPage = pathname?.split("/").filter(Boolean).pop();

  // Determine if this button should be highlighted as active
  const isActive = (() => {
    if (page === "/") {
      if (isGlobal) {
        // Panel (global) is active only on home page
        return pathname === "/";
      } else {
        // DAO Overview is active on /{daoId} pages
        return pathname === `/${daoId}` || pathname === `/${daoId}/`;
      }
    }
    // Other pages are active when the last segment matches
    return currentPage === page;
  })();

  // Generate the target path (only for navigation buttons)
  let targetPath: string = "#";

  if (!isAction) {
    if (isGlobal) {
      // Global pages always use absolute path (e.g., /donate, /glossary)
      targetPath = page ? `/${page}` : "/";
    } else if (daoId) {
      // DAO pages include daoId (e.g., /ens/risk-analysis)
      targetPath = page === "/" ? `/${daoId}` : `/${daoId}/${page}`;
    } else {
      // No daoId: Panel goes to home, others go to "#"
      targetPath = page === "/" ? "/" : "#";
    }
  }

  const baseClassName = cn(
    "flex h-[33px] w-full cursor-pointer items-center gap-2 px-2 py-2 text-sm font-medium transition-all",
    {
      "bg-primary text-inverted": isActive,
      "bg-surface-background text-secondary hover:bg-surface-contrast":
        !isActive,
      "justify-center": isCollapsed,
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
      {!isCollapsed && (
        <p
          className={cn(
            "flex-1 whitespace-nowrap text-[14px] font-medium leading-[20px] transition-colors",
            {
              "text-inverted": isActive,
              "text-secondary group-hover:text-primary": !isActive,
            },
          )}
        >
          {label}
        </p>
      )}
    </>
  );

  // Render as button for action buttons (e.g., Alerts)
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
