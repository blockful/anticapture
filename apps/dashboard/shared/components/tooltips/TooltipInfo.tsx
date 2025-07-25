"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/shared/utils/";
import { useState } from "react";

export function TooltipInfo({
  text = "",
  className,
}: {
  text?: string;
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
        <Info className="text-secondary size-3.5 cursor-pointer" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
        className={cn(
          "border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-3 text-center shadow-sm",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
          "break-words whitespace-normal",
          className,
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
