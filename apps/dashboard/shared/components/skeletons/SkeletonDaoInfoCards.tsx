"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";

export const SkeletonDaoInfoCards = () => {
  return (
    <Card className="sm:bg-surface-default xl4k:max-w-full flex w-[342px]! flex-col border-none sm:w-full! sm:max-w-full">
      <CardHeader
        id="daoinfo-basecard-header"
        className="min-h-[32px] px-0 py-2! sm:p-2"
      >
        <div className="flex w-full items-center justify-start">
          <CardTitle className="text-primary flex items-center gap-2 text-xs font-semibold uppercase">
            <div className="size-4 animate-pulse rounded-full bg-gray-700/50" />
            <div className="h-4 w-16 animate-pulse rounded-sm bg-gray-700/50" />
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-[71px] w-full flex-col gap-4 p-0 sm:gap-5 sm:p-2">
        {[1, 2].map((_, index) => (
          <div
            key={index}
            className="flex min-h-[32px] justify-between gap-2 sm:flex-col"
          >
            <div className="flex w-full items-center gap-1.5">
              <h1 className="text-foreground text-sm font-normal">
                <div className="h-4 w-16 animate-pulse rounded-sm bg-gray-700/50" />
              </h1>
              <div className="size-3 animate-pulse rounded-full bg-gray-700/50" />
            </div>

            <div className="flex h-full w-full justify-end gap-2 sm:justify-start">
              {[1, 2].map((_, itemIndex) => (
                <div key={itemIndex} className="flex">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-700/50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
