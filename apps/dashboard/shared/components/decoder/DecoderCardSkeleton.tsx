import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";

/** Card-shaped shimmer shown only after the 300ms delayed-flag threshold. */
export const DecoderCardSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="border-border-default bg-surface-default flex w-full flex-col gap-3 border p-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-5 w-28" />
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="grid grid-cols-[6rem_5.5rem_1fr] gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
);
