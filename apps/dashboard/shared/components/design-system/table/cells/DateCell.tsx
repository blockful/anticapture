"use client";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils";
import {
  formatRelativeTime,
  formatFullDate,
} from "@/shared/utils/formatRelativeTime";

interface DateCellProps {
  timestampSeconds: number | string;
  className?: string;
}

export const DateCell = ({ timestampSeconds, className }: DateCellProps) => {
  const relativeTime = formatRelativeTime(timestampSeconds);
  const fullDate = formatFullDate(timestampSeconds);

  return (
    <Tooltip tooltipContent={fullDate}>
      <span
        className={cn(
          "text-primary cursor-default whitespace-nowrap text-sm",
          className,
        )}
      >
        {relativeTime}
      </span>
    </Tooltip>
  );
};
