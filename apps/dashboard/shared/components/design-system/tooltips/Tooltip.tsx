"use client";

import {
  Tooltip as TooltipPrimitive,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/";
import { ReactNode, useState } from "react";

export function Tooltip({
  children,
  tooltipContent,
  className,
}: {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <TooltipPrimitive open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger
        role="button"
        aria-label="tooltip-info"
        onClick={handleToggle}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
        className={cn(
          "bg-surface-contrast border-border-contrast text-primary max-w-[350px]",
          className,
        )}
      >
        {tooltipContent}
      </TooltipContent>
    </TooltipPrimitive>
  );
}
