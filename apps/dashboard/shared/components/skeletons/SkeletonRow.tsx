"use client";

import { cn } from "@/shared/utils";

export const SkeletonRow = ({
  className,
  parentClassName,
}: {
  className?: string;
  parentClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "flex animate-pulse justify-center space-x-2",
        parentClassName,
      )}
    >
      <div className={cn("bg-surface-contrast rounded-sm", className)} />
    </div>
  );
};
