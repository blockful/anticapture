"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/";
import { ReactNode, useState } from "react";

export function TooltipPlain({
  triggerComponent,
  contentComponent,
  className,
}: {
  triggerComponent: ReactNode;
  contentComponent: ReactNode;
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
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger
        role="button"
        aria-label="tooltip-info"
        onClick={handleToggle}
      >
        {triggerComponent}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
        className={cn(
          "border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-3 text-center shadow-sm",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
          "whitespace-normal break-words",
          className,
        )}
      >
        {contentComponent}
      </TooltipContent>
    </Tooltip>
  );
}
