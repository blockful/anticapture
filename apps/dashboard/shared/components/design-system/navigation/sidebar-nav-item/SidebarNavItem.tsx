"use client";

import Link from "next/link";
import type { ElementType } from "react";

import { cn } from "@/shared/utils/cn";

export type SidebarNavItemProps = {
  icon: ElementType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  isNew?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export const SidebarNavItem = ({
  icon: Icon,
  label,
  isActive = false,
  isCollapsed = false,
  isNew = false,
  href,
  onClick,
  className,
}: SidebarNavItemProps) => {
  const baseClassName = cn(
    // Base/layout
    "group flex w-full cursor-pointer items-center gap-2",
    // Sizing
    "h-[33px] px-2 py-2",
    // Typography
    "text-sm font-medium",
    // Colors/transitions
    "transition-all",
    // Active vs inactive
    isActive && "bg-primary text-inverted",
    !isActive &&
      "bg-surface-background text-secondary hover:bg-surface-contrast",
    // Collapsed: center the icon
    isCollapsed && "justify-center",
    className,
  );

  const iconClassName = cn(
    "size-4 transition-colors",
    isActive && "text-inverted",
    !isActive && "text-secondary group-hover:text-primary",
  );

  const labelClassName = cn(
    "flex-1 whitespace-nowrap text-left text-[14px] font-medium leading-[20px] transition-colors",
    isActive && "text-inverted",
    !isActive && "text-secondary group-hover:text-primary",
  );

  const content = (
    <>
      <div className="relative shrink-0">
        <Icon className={iconClassName} />
        {isNew && isCollapsed && (
          <span className="bg-orange-400/12 absolute -right-0.5 -top-0.5 size-1.5 rounded-full" />
        )}
      </div>
      {!isCollapsed && <p className={labelClassName}>{label}</p>}
      {isNew && !isCollapsed && (
        <span className="bg-orange-400/12 rounded-full px-2 py-0.5 text-[11px] font-medium text-orange-400">
          New
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} prefetch className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
};
