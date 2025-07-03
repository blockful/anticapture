"use client";

import React from "react";
import { cn } from "@/shared/utils";

interface SimpleProgressBarProps {
  percentage: number; // 0-100
  className?: string;
}

export const SimpleProgressBar = ({
  percentage,
  className,
}: SimpleProgressBarProps) => {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div
      className={cn(
        "bg-middle-dark relative h-2 w-full overflow-hidden rounded-full",
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
