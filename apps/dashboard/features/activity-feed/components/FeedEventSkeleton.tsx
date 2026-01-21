"use client";

import { cn } from "@/shared/utils";

interface FeedEventSkeletonProps {
  className?: string;
}

export const FeedEventSkeleton = ({ className }: FeedEventSkeletonProps) => {
  return (
    <div
      className={cn(
        "bg-surface-default border-border-default flex animate-pulse gap-3 border-b px-4 py-3",
        className,
      )}
    >
      {/* Icon skeleton */}
      <div className="bg-surface-contrast size-10 shrink-0 rounded-full" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-surface-contrast size-6 rounded-full" />
          <div className="bg-surface-contrast h-4 w-24 rounded" />
          <div className="bg-surface-contrast h-4 w-16 rounded" />
        </div>
        <div className="bg-surface-contrast h-4 w-3/4 rounded" />
        <div className="bg-surface-contrast h-3 w-20 rounded" />
      </div>

      {/* Metadata skeleton */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="bg-surface-contrast h-5 w-12 rounded-full" />
        <div className="bg-surface-contrast h-3 w-16 rounded" />
      </div>
    </div>
  );
};
