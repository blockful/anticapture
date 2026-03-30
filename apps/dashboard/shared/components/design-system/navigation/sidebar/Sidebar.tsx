import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

export type SidebarProps = {
  isCollapsed?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Sidebar = ({
  isCollapsed = false,
  header,
  footer,
  children,
  className,
}: SidebarProps) => (
  <aside
    className={cn(
      // Layout
      "relative flex h-screen flex-col",
      // Sizing
      isCollapsed ? "w-[68px]" : "w-[258px]",
      // Colors
      "bg-surface-background border-border-default border-r",
      // Transitions
      "transition-all duration-300",
      className,
    )}
  >
    {header && <div className="shrink-0">{header}</div>}
    <div className="flex flex-1 flex-col justify-between overflow-y-auto">
      <div className="flex flex-col gap-3 p-2">{children}</div>
      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  </aside>
);
