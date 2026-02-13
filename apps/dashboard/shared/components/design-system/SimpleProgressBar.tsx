"use client";

import { cn } from "@/shared/utils";

interface SimpleProgressBarProps {
  percentage: number; // 0-100
  className?: string;
  progressClassName?: string;
}

export const SimpleProgressBar = ({
  percentage,
  className,
  progressClassName,
}: SimpleProgressBarProps) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div
      className={cn(
        "bg-middle-dark relative h-1 w-full overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "h-full bg-white transition-all duration-300 ease-in-out",
          progressClassName,
        )}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
};
