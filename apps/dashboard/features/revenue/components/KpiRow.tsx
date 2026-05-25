"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import {
  useGetRevenueActiveNames,
  useGetRevenueNewWallets,
  useGetRevenueRenewalFunnel,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils/cn";

import { computeKpis } from "@/features/revenue/utils/transform";
import type { KpiWindow } from "@/features/revenue/utils/window";

const TIME_PERIOD_OPTIONS = [
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "3Y", value: "3y" },
  { label: "MAX", value: "max" },
];

const WINDOW_BY_PERIOD: Record<string, KpiWindow> = {
  "3m": { months: 3, label: "3M" },
  "6m": { months: 6, label: "6M" },
  "1y": { months: 12, label: "1Y" },
  "3y": { months: 36, label: "3Y" },
  max: { months: null, label: "MAX" },
};

export const KpiRow = () => {
  const [timePeriod, setTimePeriod] = useState("1y");

  const activeWindow = useMemo(
    () => WINDOW_BY_PERIOD[timePeriod] ?? WINDOW_BY_PERIOD.max,
    [timePeriod],
  );

  const { data: activeNamesData, isLoading: activeNamesLoading } =
    useGetRevenueActiveNames("ens");
  const { data: newWalletsData, isLoading: newWalletsLoading } =
    useGetRevenueNewWallets("ens");
  const { data: funnelData, isLoading: funnelLoading } =
    useGetRevenueRenewalFunnel("ens");
  const { data: totalsData, isLoading: totalsLoading } =
    useGetRevenueTotals("ens");

  const isLoading =
    activeNamesLoading || newWalletsLoading || funnelLoading || totalsLoading;

  const kpis = useMemo(() => {
    if (!activeNamesData || !newWalletsData || !funnelData || !totalsData)
      return null;
    return computeKpis(
      activeNamesData.items,
      newWalletsData.items,
      funnelData.items,
      totalsData.items,
      activeWindow,
    );
  }, [activeNamesData, newWalletsData, funnelData, totalsData, activeWindow]);

  return (
    <Card>
      {/* Header row */}
      <div className="border-border-default flex items-center justify-between border-b p-4">
        <p className="text-secondary text-sm font-medium">Usage & Adoption</p>

        {/* Desktop: SegmentedControl */}
        <SegmentedControl
          items={TIME_PERIOD_OPTIONS}
          value={timePeriod}
          size="sm"
          onValueChange={setTimePeriod}
          className="hidden lg:inline-flex"
        />

        {/* Mobile: Select dropdown */}
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="border-border-default bg-surface-default text-primary rounded-base border px-2 py-1 text-xs font-medium lg:hidden"
        >
          {TIME_PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI columns — 2x2 mobile, 4col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {isLoading || !kpis
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "p-4",
                  index < 3 && "lg:border-border-default lg:border-r",
                  index % 2 === 0 &&
                    "border-border-default border-r lg:border-r",
                  index < 2 && "border-border-default border-b lg:border-b-0",
                )}
              >
                <div className="bg-surface-raised h-4 w-24 animate-pulse rounded" />
                <div className="bg-surface-raised mt-2 h-9 w-20 animate-pulse rounded" />
                <div className="bg-surface-raised mt-2 h-4 w-32 animate-pulse rounded" />
              </div>
            ))
          : kpis.map((kpi, index) => (
              <div
                key={kpi.title}
                className={cn(
                  "p-4",
                  index < kpis.length - 1 &&
                    "lg:border-border-default lg:border-r",
                  index % 2 === 0 &&
                    "border-border-default border-r lg:border-r",
                  index < 2 && "border-border-default border-b lg:border-b-0",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-secondary text-sm font-medium">
                    {kpi.title}
                  </p>
                  {kpi.tooltip && (
                    <Tooltip
                      tooltipContent={
                        <p className="text-secondary text-sm font-normal leading-5">
                          {kpi.tooltip}
                        </p>
                      }
                      triggerClassName="inline-flex cursor-help items-center border-0 bg-transparent p-0"
                    >
                      <Info className="text-secondary size-3.5" />
                    </Tooltip>
                  )}
                </div>
                <p className="text-primary mt-1 font-mono text-[30px] font-medium leading-9">
                  {kpi.value}
                </p>
                <p className="text-secondary mt-1 flex items-center gap-1 text-sm">
                  {kpi.trend === "up" && (
                    <ArrowUp className="text-success size-3.5" />
                  )}
                  {kpi.trend === "down" && (
                    <ArrowDown className="size-3.5 text-[#f87171]" />
                  )}
                  <span
                    className={
                      kpi.trend === "up"
                        ? "text-success"
                        : kpi.trend === "down"
                          ? "text-[#f87171]"
                          : "text-secondary"
                    }
                  >
                    {kpi.subtext}
                  </span>
                </p>
              </div>
            ))}
      </div>
    </Card>
  );
};
