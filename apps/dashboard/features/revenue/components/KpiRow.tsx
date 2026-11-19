"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  useGetRevenueNewWallets,
  useGetRevenueRenewalFunnel,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { DeepLinkTitle } from "@/shared/components/deep-link";
import { Card } from "@/shared/components/design-system/cards/card/Card";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils/cn";
import { deepLinkTarget } from "@/shared/utils/deepLink";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { REVENUE_ANCHORS } from "@/features/revenue/utils/anchors";
import type { RevenueDataState } from "@/features/revenue/utils/meta";
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

/** The block each KPI links to, in the order `computeKpis` returns the KPIs. */
const KPI_ANCHORS = [
  REVENUE_ANCHORS.newWallets,
  REVENUE_ANCHORS.renewalRate,
  REVENUE_ANCHORS.revenueByPeriod,
];
const KPI_COUNT = KPI_ANCHORS.length;

const PERCENTAGE_POINTS_TOOLTIP =
  "Percentage points: the absolute change between two percentages. Going from 30% to 39% is +9pp, not +9%.";

export const KpiRow = () => {
  const [timePeriod, setTimePeriod] = useState("1y");

  const activeWindow = useMemo(
    () => WINDOW_BY_PERIOD[timePeriod] ?? WINDOW_BY_PERIOD.max,
    [timePeriod],
  );

  const newWalletsQuery = useGetRevenueNewWallets("ens");
  const newWallets = useRevenueDataState(newWalletsQuery);
  const funnelQuery = useGetRevenueRenewalFunnel("ens");
  const funnel = useRevenueDataState(funnelQuery);
  const totalsQuery = useGetRevenueTotals("ens");
  const totals = useRevenueDataState(totalsQuery);

  const isLoading =
    newWallets.isLoading || funnel.isLoading || totals.isLoading;

  // Each KPI reads its own series; one failed request marks only its card
  // "Unavailable" instead of holding the whole row in a loading state.
  const kpis = useMemo(() => {
    if (isLoading) return null;
    const toSeries = <T,>(state: RevenueDataState<T>) => ({
      items: state.items,
      cutoff: state.cutoff,
      cutoffKnown: state.cutoffKnown,
      unavailable: state.isUnavailable,
    });
    return computeKpis(
      {
        newWallets: toSeries(newWallets),
        funnel: toSeries(funnel),
        totals: toSeries(totals),
      },
      activeWindow,
    );
  }, [isLoading, newWallets, funnel, totals, activeWindow]);

  return (
    <Card {...deepLinkTarget(REVENUE_ANCHORS.usageAndAdoption)}>
      {/* Header row */}
      <div className="border-border-default flex items-center justify-between gap-3 border-b p-4">
        <DeepLinkTitle slug={REVENUE_ANCHORS.usageAndAdoption}>
          Usage & Adoption
        </DeepLinkTitle>

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

      {/* KPI columns — stacked on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {KPI_ANCHORS.map((anchor, index) => {
          const kpi = isLoading ? undefined : kpis?.[index];
          return (
            // The tile is on the page while it loads, so a link to it has
            // somewhere to land before the data arrives.
            <div
              key={anchor}
              {...deepLinkTarget(anchor)}
              className={cn(
                "p-4",
                index < KPI_COUNT - 1 &&
                  "border-border-default border-b lg:border-b-0 lg:border-r",
              )}
            >
              {!kpi ? (
                <>
                  <div className="bg-surface-raised h-4 w-24 animate-pulse rounded" />
                  <div className="bg-surface-raised mt-2 h-9 w-20 animate-pulse rounded" />
                  <div className="bg-surface-raised mt-2 h-4 w-32 animate-pulse rounded" />
                </>
              ) : (
                <>
                  <DeepLinkTitle
                    slug={anchor}
                    info={<InfoTooltip>{kpi.tooltip}</InfoTooltip>}
                  >
                    {kpi.title}
                  </DeepLinkTitle>
                  <p
                    className={cn(
                      "mt-1 text-[30px] font-medium leading-9",
                      kpi.unavailable ? "text-secondary" : "text-primary",
                    )}
                  >
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
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
