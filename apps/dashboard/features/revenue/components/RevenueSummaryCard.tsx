"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useGetRevenueTotals } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";
import { cn } from "@/shared/utils/cn";

import type { RevenueTimeframe } from "@/features/revenue/types";
import { computeRevenueSummary } from "@/features/revenue/utils/transform";

const TIMEFRAME_OPTIONS: { label: string; value: RevenueTimeframe }[] = [
  { label: "1Y", value: "1y" },
  { label: "YTD", value: "ytd" },
  { label: "MAX", value: "max" },
];

export const RevenueSummaryCard = () => {
  const [timeframe, setTimeframe] = useState<RevenueTimeframe>("1y");
  const { data, isLoading } = useGetRevenueTotals("ens");

  const summary = useMemo(
    () => (data ? computeRevenueSummary(data.items, timeframe) : null),
    [data, timeframe],
  );

  return (
    <Card>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="border-border-default border-b p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="text-secondary text-sm font-medium">
              Protocol Revenue (actual)
            </p>
            <SegmentedControl
              items={TIMEFRAME_OPTIONS}
              value={timeframe}
              size="sm"
              onValueChange={(value) => setTimeframe(value as RevenueTimeframe)}
              className="hidden lg:inline-flex"
            />
            <Select
              items={TIMEFRAME_OPTIONS}
              value={timeframe}
              onValueChange={(value) => setTimeframe(value as RevenueTimeframe)}
              className="w-24 lg:hidden"
              aria-label="Revenue timeframe"
            />
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-9 w-32 rounded" />
          ) : (
            <p className="text-primary mt-2 text-[30px] font-medium leading-9">
              {summary?.actualAmount ?? "—"}
            </p>
          )}
        </div>

        <div className="p-4">
          <p className="text-secondary text-sm font-medium">
            Annual run rate (projected)
          </p>
          {isLoading ? (
            <>
              <Skeleton className="mt-2 h-9 w-36 rounded" />
              <Skeleton className="mt-2 h-4 w-32 rounded" />
            </>
          ) : (
            <>
              <p className="text-primary mt-2 text-[30px] font-medium leading-9">
                {summary?.runRate ?? "—"} / year
              </p>
              {summary?.qoqDelta && (
                <p
                  className={cn(
                    "mt-1 flex items-center gap-0.5 text-sm font-medium",
                    summary.qoqDelta.trend === "up"
                      ? "text-success"
                      : "text-[#f87171]",
                  )}
                >
                  {summary.qoqDelta.trend === "up" ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  {summary.qoqDelta.text}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
