import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";
import { cn } from "@/shared/utils";

interface FeedEventSkeletonProps {
  className?: string;
}

export const FeedEventSkeleton = ({ className }: FeedEventSkeletonProps) => {
  return (
    <div className={cn("flex items-start gap-2 py-2", className)}>
      {/* Icon skeleton */}
      <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="size-1 rounded-full" />
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="size-1 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
};
