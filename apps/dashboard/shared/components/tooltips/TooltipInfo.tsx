"use client";

import { cn } from "@/shared/utils/";
import { Info } from "lucide-react";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

export function TooltipInfo({
  text = "",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <Tooltip
      tooltipContent={text}
      className={cn(
        "border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-3 text-center shadow-sm",
        "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
        "whitespace-normal break-words",
        className,
      )}
    >
      <Info className="text-secondary size-3.5" />
    </Tooltip>
  );
}
