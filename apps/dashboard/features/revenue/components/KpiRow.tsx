"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  useGetRevenueNewWallets,
  useGetRevenueRenewalFunnel,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";
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

const KPI_COUNT = 3;

const PERCENTAGE_POINTS_TOOLTIP =
  "Percentage points: the absolute change between two percentages. Going from 30% to 39% is +9pp, not +9%.";

export const KpiRow = () => {
  const [timePeriod, setTimePeriod] = useState("1y");

  const activeWindow = useMemo(
    () => WINDOW_BY_PERIOD[timePeriod] ?? WINDOW_BY_PERIOD.max,
    [timePeriod],
  );

  const { data: newWalletsData, isLoading: newWalletsLoading } =
    useGetRevenueNewWallets("ens");
  const { data: funnelData, isLoading: funnelLoading } =
    useGetRevenueRenewalFunnel("ens");
  const { data: totalsData, isLoading: totalsLoading } =
    useGetRevenueTotals("ens");

  const isLoading = newWalletsLoading || funnelLoading || totalsLoading;

  const kpis = useMemo(() => {
    if (!newWalletsData || !funnelData || !totalsData) return null;
    return computeKpis(
      newWalletsData.items,
      funnelData.items,
      totalsData.items,
      activeWindow,
    );
  }, [newWalletsData, funnelData, totalsData, activeWindow]);

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

        <Select
          items={TIME_PERIOD_OPTIONS}
          value={timePeriod}
          onValueChange={setTimePeriod}
          className="w-24 lg:hidden"
          aria-label="Usage timeframe"
        />
      </div>

      {/* KPI columns — stacked on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {isLoading || !kpis
          ? Array.from({ length: KPI_COUNT }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "p-4",
                  index < KPI_COUNT - 1 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="mt-2 h-9 w-20 rounded" />
                <Skeleton className="mt-2 h-4 w-32 rounded" />
              </div>
            ))
          : kpis.map((kpi, index) => (
              <div
                key={kpi.title}
                className={cn(
                  "p-4",
                  index < kpis.length - 1 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                <p className="text-secondary text-sm font-medium">
                  {kpi.title}
                </p>
                <p className="text-primary mt-1 text-[30px] font-medium leading-9">
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
                    {kpi.delta ? (
                      <>
                        {kpi.delta.value}
                        {kpi.delta.unit === "pp" ? (
                          <Tooltip
                            asChild
                            tooltipContent={
                              <p className="text-secondary text-sm font-normal leading-5">
                                {PERCENTAGE_POINTS_TOOLTIP}
                              </p>
                            }
                            triggerClassName="cursor-help underline decoration-dotted underline-offset-2"
                          >
                            <span>{kpi.delta.unit}</span>
                          </Tooltip>
                        ) : (
                          kpi.delta.unit
                        )}{" "}
                        {kpi.delta.comparison}
                      </>
                    ) : (
                      kpi.subtext
                    )}
                  </span>
                </p>
              </div>
            ))}
      </div>
    </Card>
  );
};
