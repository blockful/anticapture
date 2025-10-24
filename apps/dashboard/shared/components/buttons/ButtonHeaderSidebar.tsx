"use client";

import { cn } from "@/shared/utils/";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ButtonHTMLAttributes, ElementType } from "react";

interface ButtonHeaderSidebarProps
  extends ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  page: string;
  icon: ElementType;
  label: string;
  className?: string;
  isGlobal?: boolean;
  isAction?: boolean;
}

export const ButtonHeaderSidebar = ({
  page,
  icon: Icon,
  label,
  className,
  isGlobal = false,
  isAction = false,
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
    "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent p-2 text-sm font-medium",
    {
      "cursor-default bg-white": isActive,
      "hover:border-light-dark hover:bg-surface-contrast": !isActive,
    },
    className,
  );

  const content = (
    <>
      <Icon
        className={cn("size-4", {
          "text-inverted": isActive,
          "text-secondary group-hover:text-primary": !isActive,
        })}
      />
      <p
        className={cn({
          "text-inverted": isActive,
          "text-secondary group-hover:text-primary": !isActive,
        })}
      >
        {label}
      </p>
    </>
  );

  // Render as button for action buttons (e.g., Alerts)
  if (isAction) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClassName}
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
      {...props}
      className={baseClassName}
    >
      {content}
    </Link>
  );
};
