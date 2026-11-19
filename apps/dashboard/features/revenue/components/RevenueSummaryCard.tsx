"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useGetRevenueTotals } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils/cn";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import type { RevenueTimeframe } from "@/features/revenue/types";
import { UNAVAILABLE_TEXT } from "@/features/revenue/utils/meta";
import { computeRevenueSummary } from "@/features/revenue/utils/transform";

const TIMEFRAME_OPTIONS: { label: string; value: RevenueTimeframe }[] = [
  { label: "1Y", value: "1y" },
  { label: "YTD", value: "ytd" },
  { label: "MAX", value: "max" },
];

const REVENUE_BASIS =
  "Counts .eth registrations, renewals and premiums paid to the v1 ETH registrar controllers, when paid; ETH converted to USD at each month's average ETH price. 2023-controller renewals outside Dec 2024 to Sep 2025 are counted at the amount sent, before refunds of overpayment. Payments through ENSv2 (from Oct 27, 2026, in USDC or DAI) are not yet included.";

export const RevenueSummaryCard = () => {
  const [timeframe, setTimeframe] = useState<RevenueTimeframe>("1y");
  const totalsQuery = useGetRevenueTotals("ens");
  const totals = useRevenueDataState(totalsQuery);
  const { isLoading, isUnavailable } = totals;

  const summary = useMemo(
    () =>
      isUnavailable
        ? null
        : computeRevenueSummary(
            totals.items,
            timeframe,
            totals.cutoff,
            totals.cutoffKnown,
          ),
    [totals, isUnavailable, timeframe],
  );

  return (
    <Card>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="border-border-default border-b p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <p className="text-secondary text-sm font-medium">
                Protocol Revenue (actual)
              </p>
              <InfoTooltip>
                Protocol revenue in the selected period
                {summary ? ` (${summary.actualPeriod})` : ""}. {REVENUE_BASIS}
              </InfoTooltip>
            </div>
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
          ) : isUnavailable ? (
            <p className="text-secondary mt-2 text-[30px] font-medium leading-9">
              {UNAVAILABLE_TEXT}
            </p>
          ) : (
            <>
              <p className="text-primary mt-2 text-[30px] font-medium leading-9">
                {summary?.actualAmount ?? "—"}
              </p>
              {summary && (
                <p className="text-secondary mt-1 text-sm">
                  {summary.actualPeriod}
                </p>
              )}
            </>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5">
            <p className="text-secondary text-sm font-medium">
              Annualized run rate
            </p>
            <InfoTooltip>
              Average daily protocol revenue in the last 3 full months covered
              by the data
              {summary ? ` (${summary.runRatePeriod})` : ""}, multiplied by 365.{" "}
              {REVENUE_BASIS} A run rate annualizes recent revenue; it is not a
              forecast.
            </InfoTooltip>
          </div>
          {isLoading ? (
            <>
              <div className="bg-surface-raised mt-2 h-9 w-36 animate-pulse rounded" />
              <div className="bg-surface-raised mt-2 h-4 w-32 animate-pulse rounded" />
            </>
          ) : isUnavailable ? (
            <p className="text-secondary mt-2 text-[30px] font-medium leading-9">
              {UNAVAILABLE_TEXT}
            </p>
          ) : (
            <>
              <p className="text-primary mt-2 text-[30px] font-medium leading-9">
                {summary?.runRate ?? "—"} / year
              </p>
              {summary?.qoqDelta && (
                <Tooltip
                  asChild
                  tooltipContent={
                    <p className="text-secondary text-left text-sm font-normal leading-5">
                      Change in average daily revenue vs the previous 3 full
                      months ({summary.qoqDelta.previousPeriod}).
                    </p>
                  }
                  triggerClassName="cursor-help"
                >
                  <p
                    className={cn(
                      "mt-1 flex w-fit items-center gap-0.5 text-sm font-medium",
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
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
