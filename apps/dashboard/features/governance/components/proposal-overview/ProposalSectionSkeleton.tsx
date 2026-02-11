import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

export const ProposalSectionSkeleton = () => {
  return (
    <div className="w-full pb-20 lg:pb-0">
      {/* Header Skeleton */}
      <div className="bg-surface-background border-border-default sticky -top-[57px] z-20 flex h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b py-2 lg:top-0">
        <div className="mx-auto flex w-full flex-1 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            {/* Back arrow */}
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="size-[14px] shrink-0"
            />
            {/* DAO Avatar */}
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="size-6 shrink-0 rounded-full"
            />
            {/* DAO name text */}
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-[20px] w-48 shrink-0"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Voting power section */}
            <div className="hidden flex-col items-end lg:flex">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[16px] w-24 shrink-0"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-[20px] w-16 shrink-0"
              />
            </div>
            {/* Vote button */}
            <SkeletonRow
              parentClassName="hidden animate-pulse lg:flex"
              className="h-10 w-32 shrink-0 rounded"
            />
          </div>
        </div>
      </div>

      {/* Spacer - hidden on mobile */}
      <div className="bg-surface-background sticky top-[65px] z-10 hidden h-5 w-full lg:block" />

      {/* Main Content */}
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
          {/* Left Side - Title, Info, Status */}
          <div className="left-0 top-5 flex h-fit w-full flex-col gap-4 self-start lg:sticky lg:top-[85px] lg:w-[420px]">
            {/* Title Section Skeleton */}
            <div className="flex w-full flex-col gap-3">
              {/* Badge + Bullet + Proposer */}
              <div className="flex w-full items-center justify-start gap-2">
                {/* Badge */}
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-[22px] w-20 shrink-0 rounded-full"
                />
                {/* Bullet */}
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-1 shrink-0 rounded-full"
                />
                {/* ENS Avatar (circle + name) */}
                <div className="flex items-center gap-1.5">
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-5 shrink-0 rounded-full"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-[20px] w-24 shrink-0"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="flex w-full flex-col gap-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-[28px] w-full"
                />
              </div>

              {/* Forum + Share links */}
              <div className="flex w-full items-center justify-start gap-2">
                {/* Forum link */}
                <div className="flex items-center gap-1">
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-4 shrink-0"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-[20px] w-12 shrink-0"
                  />
                </div>
                {/* Bullet */}
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-1 shrink-0 rounded-full"
                />
                {/* Share link */}
                <div className="flex items-center gap-1">
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-4 shrink-0"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-[20px] w-12 shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Info Section Skeleton (Current Results) */}
            <div className="border-border-default flex w-full flex-col border lg:w-[420px]">
              <div className="flex w-full flex-col p-3 lg:w-[420px]">
                {/* Current Results Title */}
                <div className="flex items-center gap-1 pb-4">
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-4 shrink-0"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-[20px] w-28 shrink-0"
                  />
                </div>

                {/* Voting results - For, Against, Abstain */}
                <div className="flex flex-col gap-3 lg:w-full">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex w-full items-center justify-between gap-2 lg:justify-start"
                    >
                      {/* Vote type icon + label */}
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
                      {/* Progress bar */}
                      <SkeletonRow
                        parentClassName="flex animate-pulse w-full lg:w-[184px] lg:flex-1"
                        className="h-1 w-full"
                      />
                      {/* Vote count + percentage */}
                      <div className="flex w-[100px] items-center gap-2">
                        <SkeletonRow
                          parentClassName="flex animate-pulse"
                          className="h-[20px] w-12 shrink-0"
                        />
                        <SkeletonRow
                          parentClassName="flex animate-pulse"
                          className="h-[20px] w-12 shrink-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dashed divider */}
                <div className="w-full py-3">
                  <div className="border-surface-default w-full border-b border-dashed" />
                </div>

                {/* Quorum section */}
                <div className="flex items-center gap-2">
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-3.5 shrink-0"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-[20px] w-14 shrink-0"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="size-1 shrink-0 rounded-full"
                  />
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-[20px] w-24 shrink-0"
                  />
                </div>
              </div>

              {/* Time Left section */}
              <div className="bg-surface-opacity-brand flex w-full items-center gap-2 p-3">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-1 shrink-0 rounded-full"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-[16px] w-32 shrink-0"
                />
              </div>
            </div>

            {/* Status Section Skeleton */}
            <div className="border-border-default flex w-full flex-col gap-3 border p-3">
              <div className="flex items-center gap-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-4 shrink-0"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-[20px] w-14 shrink-0"
                />
              </div>

              {/* Timeline skeleton - 3 items */}
              <div className="flex flex-col gap-0">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2">
                      {/* Timeline dot */}
                      <SkeletonRow
                        parentClassName="flex animate-pulse"
                        className="size-2 shrink-0 rounded-full"
                      />
                      {/* Timeline content */}
                      <SkeletonRow
                        parentClassName="flex animate-pulse"
                        className="h-[20px] w-48 shrink-0"
                      />
                    </div>
                    {/* Connector line between items */}
                    {index < 2 && (
                      <div className="bg-secondary ml-[3px] h-5 w-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Tabs Section Skeleton */}
          <div className="flex flex-1 flex-col lg:min-w-0 lg:bg-surface-default">
            {/* Tabs header */}
            <div className="border-border-default sticky left-0 top-[7px] z-10 flex w-full shrink-0 gap-2 border-b lg:top-[85px] lg:bg-surface-default lg:px-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonRow
                  key={index}
                  parentClassName="flex animate-pulse"
                  className="h-10 w-24 shrink-0"
                />
              ))}
            </div>

            {/* Tab content skeleton - Description */}
            <div className="flex flex-1 flex-col gap-4 p-4">
              <SkeletonRow
                parentClassName="flex animate-pulse justify-start"
                className="h-[28px] w-48 shrink-0"
              />
              <div className="flex flex-col gap-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse justify-start"
                  className="h-[20px] w-full"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse justify-start"
                  className="h-[20px] w-full"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse justify-start"
                  className="h-[20px] w-5/6"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse justify-start"
                  className="h-[20px] w-4/5"
                />
              </div>

              {/* More content */}
              <div className="mt-4 flex flex-col gap-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse justify-start"
                  className="h-[24px] w-32 shrink-0"
                />
                {Array.from({ length: 2 }).map((_, index) => (
                  <SkeletonRow
                    key={index}
                    parentClassName="flex animate-pulse justify-start"
                    className="h-[20px] w-full"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar skeleton for mobile voting */}
      <div className="bg-surface-background fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 p-4 lg:hidden dark:border-gray-800">
        <SkeletonRow
          parentClassName="flex animate-pulse w-full"
          className="h-10 w-full rounded"
        />
      </div>
    </div>
  );
};
