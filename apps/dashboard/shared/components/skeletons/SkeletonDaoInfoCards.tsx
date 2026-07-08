"use client";

import {
  Card,
  CardHeader,
  CardContent,
} from "@/shared/components/design-system/cards";
import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";

export const SkeletonDaoInfoCards = () => {
  return (
    <Card className="lg:bg-surface-default xl4k:max-w-full w-[342px]! lg:w-full! flex flex-col border-none lg:max-w-full">
      <CardHeader
        id="daoinfo-basecard-header"
        className="py-2! min-h-[32px] px-0 lg:p-2"
      >
        <div className="flex w-full items-center justify-start">
          <div className="text-primary flex items-center gap-2 text-xs font-semibold uppercase">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-sm" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-[71px] w-full flex-col gap-4 p-0 lg:gap-5 lg:p-2">
        {[1, 2].map((_, index) => (
          <div
            key={index}
            className="flex min-h-[32px] justify-between gap-2 lg:flex-col"
          >
            <div className="flex w-full items-center gap-1.5">
              <h1 className="text-secondary text-sm font-normal">
                <Skeleton className="h-4 w-16 rounded-sm" />
              </h1>
              <Skeleton className="size-3 rounded-full" />
            </div>

            <div className="flex h-full w-full justify-end gap-2 lg:justify-start">
              {[1, 2].map((_, itemIndex) => (
                <div key={itemIndex} className="flex">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
