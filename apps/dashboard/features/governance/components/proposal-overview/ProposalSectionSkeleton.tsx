import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

export const ProposalSectionSkeleton = () => {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="border-border-default mx-auto flex h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b px-5 py-2">
        <div className="m-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-[14px] w-[14px] shrink-0"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="size-6 shrink-0 rounded-full"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-[20px] w-40 shrink-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden flex-col items-end gap-0.5 lg:flex">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[16px] w-32 shrink-0"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-20 shrink-0"
              />
            </div>
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-10 w-32 shrink-0 rounded"
            />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:flex-row">
        {/* Left Side - Title, Info, Status */}
        <div className="left-0 top-5 flex h-fit w-full shrink-0 flex-col gap-6 self-start lg:sticky lg:w-[420px]">
          {/* Title Section Skeleton */}
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full items-center justify-start gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[22px] w-20 shrink-0 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-1 w-1 shrink-0 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-32 shrink-0"
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[32px] w-full"
              />
            </div>

            <div className="flex w-full items-center gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-16 shrink-0"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-1 w-1 shrink-0 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-16 shrink-0"
              />
            </div>
          </div>

          {/* Info Section Skeleton */}
          <div className="border-surface-default flex w-full flex-col border lg:w-[420px]">
            <div className="flex w-full flex-col gap-3 p-3 lg:w-[420px]">
              {/* Current Results Title */}
              <div className="flex items-center gap-1 pb-1">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-4 shrink-0"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-[20px] w-32 shrink-0"
                />
              </div>

              {/* Voting results skeleton - For, Against, Abstain */}
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex w-full flex-col gap-1">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex w-[100px] shrink-0 items-center gap-2">
                      <SkeletonRow
                        parentClassName="flex animate-pulse"
                        className="size-3.5 shrink-0 rounded-full"
                      />
                      <SkeletonRow
                        parentClassName="flex animate-pulse"
                        className="h-[20px] w-12 shrink-0"
                      />
                    </div>
                    <SkeletonRow
                      parentClassName="flex animate-pulse"
                      className="h-[20px] w-24 shrink-0"
                    />
                    <SkeletonRow
                      parentClassName="flex animate-pulse"
                      className="h-[20px] w-16 shrink-0"
                    />
                  </div>
                  <SkeletonRow
                    parentClassName="flex animate-pulse w-full"
                    className="h-2 w-full"
                  />
                </div>
              ))}

              {/* Divider */}
              {/* <div className="border-surface-default my-2 w-full border-t" /> */}
            </div>
          </div>

          {/* Status Section Skeleton */}
          <div className="border-surface-default flex w-full flex-col gap-3 border p-3">
            <div className="flex items-center gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="size-4 shrink-0"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-16 shrink-0"
              />
            </div>

            {/* Timeline skeleton */}
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-2 shrink-0 rounded-full"
                  />
                  <div className="flex flex-col gap-1">
                    <SkeletonRow
                      parentClassName="flex animate-pulse"
                      className="h-[20px] w-32 shrink-0"
                    />
                    <SkeletonRow
                      parentClassName="flex animate-pulse"
                      className="h-[16px] w-24 shrink-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Vote Button Skeleton */}
          <SkeletonRow
            parentClassName="flex animate-pulse w-full lg:hidden"
            className="h-10 w-full rounded"
          />
        </div>

        {/* Right Side - Tabs Section Skeleton */}
        <div className="flex w-full flex-col gap-4">
          {/* Tabs skeleton */}
          <div className="border-border-default flex gap-2 border-b">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonRow
                key={index}
                parentClassName="flex animate-pulse"
                className="h-10 w-24 shrink-0"
              />
            ))}
          </div>

          {/* Tab content skeleton - Description */}
          <div className="flex flex-col gap-4">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-[32px] w-48 shrink-0"
            />
            <div className="flex flex-col gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-5/6"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-4/5"
              />
            </div>

            {/* Actions skeleton */}
            <div className="mt-4 flex flex-col gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[24px] w-32 shrink-0"
              />
              {Array.from({ length: 2 }).map((_, index) => (
                <SkeletonRow
                  key={index}
                  parentClassName="flex animate-pulse"
                  className="h-[20px] w-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
