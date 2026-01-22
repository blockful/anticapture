"use client";

import { cn } from "@/shared/utils";

interface SimpleProgressBarProps {
  percentage: number; // 0-100
  className?: string;
}

export const SimpleProgressBar = ({
  percentage,
  className,
}: SimpleProgressBarProps) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div
      className={cn(
        "bg-middle-dark relative h-1 w-full overflow-hidden rounded-full",
        className,
      )}
    >
      <div
        className="h-full bg-white transition-all duration-300 ease-in-out"
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
};
