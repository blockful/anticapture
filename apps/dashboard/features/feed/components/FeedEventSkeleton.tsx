"use client";

import { cn } from "@/shared/utils";

interface FeedEventSkeletonProps {
  className?: string;
}

export const FeedEventSkeleton = ({ className }: FeedEventSkeletonProps) => {
  return (
    <div className={cn("flex animate-pulse items-start gap-2 py-2", className)}>
      {/* Icon skeleton */}
      <div className="bg-surface-contrast mt-0.5 size-4 shrink-0 rounded" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="bg-surface-contrast size-5 rounded-full" />
          <div className="bg-surface-contrast h-4 w-20 rounded" />
          <div className="bg-surface-contrast h-4 w-32 rounded" />
          <div className="bg-surface-contrast size-5 rounded-full" />
          <div className="bg-surface-contrast h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-surface-contrast h-3 w-20 rounded" />
          <div className="bg-surface-contrast size-1 rounded-full" />
          <div className="bg-surface-contrast h-3 w-14 rounded" />
          <div className="bg-surface-contrast size-1 rounded-full" />
          <div className="bg-surface-contrast h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
};
