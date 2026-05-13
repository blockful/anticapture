"use client";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import { cn } from "@/shared/utils/cn";

import { REVENUE_OVERVIEW } from "@/features/revenue/data/mock";

export const RevenueOverviewCard = () => {
  const { totalAmount, totalContext, streams } = REVENUE_OVERVIEW;

  return (
    <Card>
      {/* Hero */}
      <div className="border-border-default border-b p-4">
        <p className="text-secondary text-sm font-medium">
          Total Protocol Revenue
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-primary text-[30px] font-medium leading-9">
            {totalAmount}
          </span>
          <span className="text-secondary text-sm">{totalContext}</span>
        </div>
      </div>

      {/* Stream columns — 1col mobile, 3col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {streams.map((stream, index) => (
          <div
            key={stream.name}
            className={cn(
              "p-4",
              index < streams.length - 1 &&
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
