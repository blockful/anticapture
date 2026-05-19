"use client";

import {
  useGetRevenueActions,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import { cn } from "@/shared/utils/cn";

import { transformToOverview } from "@/features/revenue/utils/transform";

export const RevenueOverviewCard = () => {
  const { data: totalsData, isLoading: totalsLoading } =
    useGetRevenueTotals("ens");
  const { data: actionsData, isLoading: actionsLoading } =
    useGetRevenueActions("ens");

  const isLoading = totalsLoading || actionsLoading;
  const overview =
    totalsData && actionsData
      ? transformToOverview(totalsData.items, actionsData.items)
      : null;

  return (
    <Card>
      {/* Hero */}
      <div className="border-border-default border-b p-4">
        <p className="text-secondary text-sm font-medium">
          Total Protocol Revenue
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          {isLoading ? (
            <div className="bg-surface-raised h-9 w-32 animate-pulse rounded" />
          ) : (
            <>
              <span className="text-primary text-[30px] font-medium leading-9">
                {overview?.totalAmount ?? "—"}
              </span>
              <span className="text-secondary text-sm">
                {overview?.totalContext}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stream columns — 1col mobile, 3col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "p-4",
                  index < 2 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                <div className="bg-surface-raised h-2 w-full animate-pulse rounded" />
                <div className="bg-surface-raised mt-4 h-4 w-24 animate-pulse rounded" />
                <div className="bg-surface-raised mt-2 h-7 w-20 animate-pulse rounded" />
                <div className="bg-surface-raised mt-2 h-4 w-40 animate-pulse rounded" />
              </div>
            ))
          : overview?.streams.map((stream, index) => (
              <div
                key={stream.name}
                className={cn(
                  "p-4",
                  index < overview.streams.length - 1 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                <ProgressBar
                  value={stream.sharePercent}
                  color={stream.color}
                  size="default"
                  rounded
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-secondary text-sm font-medium">
                    {stream.name}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: stream.color }}
                  >
                    {stream.share}
                  </span>
                </div>
                <p
                  className="mt-1 text-2xl font-medium"
                  style={{ color: stream.color }}
                >
                  {stream.amount}
                </p>
                <p className="text-secondary mt-1 text-sm">
                  {stream.volume}
                  <span className="mx-1.5">&middot;</span>
                  {stream.avgRevenue}
                </p>
              </div>
            ))}
      </div>
    </Card>
  );
};
