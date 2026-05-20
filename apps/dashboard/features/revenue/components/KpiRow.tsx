"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  useGetRevenueActions,
  useGetRevenueActiveNames,
  useGetRevenueNewWallets,
  useGetRevenueRenewalFunnel,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";
import type { GetRevenueTotalsQueryParams } from "@anticapture/client";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { cn } from "@/shared/utils/cn";

import { computeKpis } from "@/features/revenue/utils/transform";

const TIME_PERIOD_OPTIONS = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
  { label: "MAX", value: "max" },
];

const DAY = 24 * 60 * 60;

function monthStartUnix(unixSeconds: number): number {
  const d = new Date(unixSeconds * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 1000;
}

function getQueryParams(
  timePeriod: string,
): GetRevenueTotalsQueryParams | undefined {
  const now = Math.floor(Date.now() / 1000);
  switch (timePeriod) {
    case "7d":
      return { fromDate: now - 7 * DAY };
    case "30d":
      return { fromDate: monthStartUnix(now - 30 * DAY) };
    case "90d":
      return { fromDate: monthStartUnix(now - 90 * DAY) };
    case "1y":
      return { fromDate: monthStartUnix(now - 365 * DAY) };
    default:
      return undefined;
  }
}

export const KpiRow = () => {
  const [timePeriod, setTimePeriod] = useState("max");

  const params = useMemo(() => getQueryParams(timePeriod), [timePeriod]);

  const { data: activeNamesData, isLoading: activeNamesLoading } =
    useGetRevenueActiveNames("ens", params);
  const { data: newWalletsData, isLoading: newWalletsLoading } =
    useGetRevenueNewWallets("ens", params);
  const { data: funnelData, isLoading: funnelLoading } =
    useGetRevenueRenewalFunnel("ens", params);
  const { data: totalsData, isLoading: totalsLoading } = useGetRevenueTotals(
    "ens",
    params,
  );
  const { data: actionsData, isLoading: actionsLoading } = useGetRevenueActions(
    "ens",
    params,
  );

  const isLoading =
    activeNamesLoading ||
    newWalletsLoading ||
    funnelLoading ||
    totalsLoading ||
    actionsLoading;

  const kpis = useMemo(() => {
    if (
      !activeNamesData ||
      !newWalletsData ||
      !funnelData ||
      !totalsData ||
      !actionsData
    )
      return null;
    return computeKpis(
      activeNamesData.items,
      newWalletsData.items,
      funnelData.items,
      totalsData.items,
      actionsData.items,
    );
  }, [activeNamesData, newWalletsData, funnelData, totalsData, actionsData]);

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
                <p className="text-secondary text-sm font-medium">
                  {kpi.title}
                </p>
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
