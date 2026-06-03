"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useGetRevenueTotals } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
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
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as RevenueTimeframe)}
              className="border-border-default bg-surface-default text-primary rounded-base border px-2 py-1 text-xs font-medium lg:hidden"
            >
              {TIMEFRAME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <div className="bg-surface-raised mt-2 h-9 w-32 animate-pulse rounded" />
          ) : (
            <p className="text-primary mt-2 font-mono text-[30px] font-medium leading-9">
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
              <div className="bg-surface-raised mt-2 h-9 w-36 animate-pulse rounded" />
              <div className="bg-surface-raised mt-2 h-4 w-32 animate-pulse rounded" />
            </>
          ) : (
            <>
              <p className="text-primary mt-2 font-mono text-[30px] font-medium leading-9">
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
