"use client";

import { ReactNode } from "react";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils";

export interface TooltipCellProps {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
  onHover?: () => void;
  onClick?: () => void;
}

export const TooltipCell = ({
  children,
  tooltipContent,
  className,
  onHover,
  onClick,
}: TooltipCellProps) => {
  return (
    <Tooltip tooltipContent={tooltipContent} asChild>
      <div
        className={cn(
          "flex w-full items-center justify-end",
          onClick && "cursor-pointer",
          onClick && "hover:bg-surface-contrast hover:rounded-lg",
          "transition-colors duration-200",
          className,
        )}
        onMouseEnter={onHover}
        onClick={onClick}
      >
        {children}
      </div>
    </Tooltip>
  );
};
