"use client";

export const PageSkeleton = () => {
  return (
    <div className="flex min-h-screen w-full flex-col gap-8 border-b-2 border-b-white/10 px-4 sm:gap-6 sm:border-none sm:p-5">
      {/* Section Title Skeleton */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex h-full w-full flex-col gap-6">
          <div className="bg-surface-contrast h-4 w-1/4 animate-pulse rounded" />
          {/* Description skeleton */}
          <div className="flex flex-col gap-2">
            <div className="bg-surface-contrast h-4 w-full animate-pulse rounded" />
            <div className="bg-surface-contrast h-4 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Main Content Container Skeleton */}
      <div className="bg-surface-contrast w-full flex-1 animate-pulse rounded-lg" />
    </div>
  );
};
