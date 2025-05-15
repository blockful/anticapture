"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/shared/utils/utils";
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
        <Info className="size-3.5 cursor-pointer text-foreground" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
        className={cn(
          "z-50 rounded-lg border border-lightDark bg-dark p-3 text-center text-white shadow",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
          "whitespace-normal break-words",
          className,
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
