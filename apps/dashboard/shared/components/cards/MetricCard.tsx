"use client";

import React, { ReactNode } from "react";
import { cn } from "@/shared/utils";
import { SkeletonRow } from "@/shared/components";

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value?: string;
  className?: string;
}

export const MetricCard = ({
  icon,
  title,
  value,
  className,
}: MetricCardProps) => {
  return (
    <div
      className={cn(
        "border-middle-dark flex flex-col items-start gap-2 border bg-transparent px-3 py-2",
        className,
      )}
    >
      {/* Icon and Title Row */}
      <div className="flex items-center gap-2">
        <div className="text-secondary flex items-center justify-center">
          {icon}
        </div>
        <div className="text-secondary font-alternative text-alternative-xs font-medium tracking-widest uppercase">
          {title}
        </div>
      </div>

      {/* Value */}
      <div className="text-primary text-sm font-thin">
        {value !== undefined ? value : <SkeletonRow className="h-5 w-16" />}
      </div>
    </div>
  );
};
