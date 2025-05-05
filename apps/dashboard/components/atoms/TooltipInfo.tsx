"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { InfoIcon } from "@/components/atoms/icons";
import { cn } from "@/lib/client/utils";

export function TooltipInfo({
  text = "",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger role="button" aria-label="tooltip-info">
        <InfoIcon className="cursor-pointer text-foreground" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={false}
        className={cn(
          "z-50 min-w-[150px] max-w-md rounded-lg border border-lightDark bg-dark p-3 text-center text-white shadow",
          className,
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
