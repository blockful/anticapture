"use client";

import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";

export const PageSkeleton = () => {
  return (
    <div className="flex min-h-screen w-full flex-col gap-8 border-b-2 border-b-white/10 px-4 lg:gap-6 lg:border-none lg:p-5">
      {/* Section Title Skeleton */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex h-full w-full flex-col gap-6">
          <Skeleton className="h-4 w-1/4 rounded" />
          {/* Description skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>

      {/* Main Content Container Skeleton */}
      <Skeleton className="w-full flex-1 rounded-lg" />
    </div>
  );
};
