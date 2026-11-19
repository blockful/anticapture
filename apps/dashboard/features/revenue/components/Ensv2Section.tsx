"use client";

import { useMemo } from "react";
import { useGetRevenueEnsv2Daily } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";
import { cn } from "@/shared/utils/cn";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { formatCompact, formatUsd } from "@/features/revenue/utils/format";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import {
  ENSV2_REVENUE_BASIS,
  dailyLabelInterval,
  summarizeEnsv2,
  toEnsv2Markers,
  transformToEnsv2Migration,
  transformToEnsv2Revenue,
} from "@/features/revenue/utils/transform";

const KPI_COUNT = 4;
const CHART_HEIGHT = 260;

/** Right axis of the migration chart: a share of v1 names, e.g. "3.5%". */
const formatShareAxis = (value: number): string =>
  `${Number(value.toFixed(2))}%`;

/**
 * ENSv2 since its launch: revenue, how many v1 names have migrated, and both
 * as daily series so a campaign or a protocol change can be read against the
 * days around it.
 */
export const Ensv2Section = () => {
  const query = useGetRevenueEnsv2Daily("ens");
  const { isLoading, isUnavailable, items, cutoff, cutoffKnown } =
    useRevenueDataState(query);

  const view = useMemo(() => {
    if (isLoading || isUnavailable) return null;
    const summary = summarizeEnsv2(items, cutoff, cutoffKnown);
    if (!summary) return null;
    return {
      summary,
      revenue: transformToEnsv2Revenue(items),
      migration: transformToEnsv2Migration(items),
      markers: toEnsv2Markers(items),
      labelInterval: dailyLabelInterval(items.length),
    };
  }, [isLoading, isUnavailable, items, cutoff, cutoffKnown]);

  return (
    <Card>
      <div className="border-border-default flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <div className="flex items-center gap-1.5">
          <p className="text-secondary text-sm font-medium">ENSv2</p>
          <InfoTooltip>
            {paragraphs(
              "ENSv2 went live on Oct 27, 2026. Since then every registration and renewal is paid on ENSv2 contracts, in USDC or DAI, and v1 names can migrate to the ENSv2 registry.",
              "This section covers that period only, by UTC day. The launch day and the latest day are partial.",
            )}
          </InfoTooltip>
        </div>
        {view && (
          <p className="text-secondary text-sm">{view.summary.period}</p>
        )}
      </div>

      {isLoading ? (
        <div className="p-4">
          <div className="bg-surface-raised h-[420px] w-full animate-pulse rounded" />
        </div>
      ) : !view ? (
        <div className="p-4">
          <UnavailableChart height={200} />
        </div>
      ) : (
        <>
          <div className="border-border-default grid grid-cols-1 border-b sm:grid-cols-2 lg:grid-cols-4">
            {view.summary.kpis.map((kpi, index) => (
              <div
                key={kpi.title}
                className={cn(
                  "border-border-default p-4",
                  index < KPI_COUNT - 1 && "border-b lg:border-b-0 lg:border-r",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-secondary text-sm font-medium">
                    {kpi.title}
                  </p>
                  <InfoTooltip>{kpi.tooltip}</InfoTooltip>
                </div>
                <p className="text-primary mt-1 text-[30px] font-medium leading-9">
                  {kpi.value}
                </p>
                <p className="text-secondary mt-1 text-sm">{kpi.subtext}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2">
            <div className="border-border-default border-b p-4 xl:border-b-0 xl:border-r">
              <div className="flex items-center gap-1.5">
                <p className="text-secondary text-sm font-medium">
                  Daily revenue since ENSv2
                </p>
                <InfoTooltip>
                  {paragraphs(
                    ENSV2_REVENUE_BASIS,
                    `Formula: bars = ${code("revenue of each UTC day, by stream")}; line = ${code("running total since the launch")} (right axis).`,
                    "The first and the latest bars are partial days. Dashed lines mark dated events.",
                  )}
                </InfoTooltip>
              </div>
              <ComboChart
                barSeries={view.revenue.barSeries}
                lineSeries={view.revenue.lineSeries}
                xAxisLabels={view.revenue.xAxisLabels}
                yAxisFormatter={formatUsd}
                xAxisLabelInterval={view.labelInterval}
                markers={view.markers}
                height={CHART_HEIGHT}
                className="mt-3"
              />
            </div>

            <div className="p-4">
              <div className="flex items-center gap-1.5">
                <p className="text-secondary text-sm font-medium">
                  Migration to ENSv2
                </p>
                <InfoTooltip>
                  {paragraphs(
                    "Bars are the v1 names migrated on each UTC day. The line is the share of v1 names migrated so far (right axis).",
                    `Formula: ${code("names migrated since the launch ÷ reserved v1 names × 100")}`,
                    "Reserved v1 names are the names the protocol reserved in the ENSv2 registry before the launch. The number is fixed.",
                    "The first and the latest bars are partial days. Dashed lines mark dated events.",
                  )}
                </InfoTooltip>
              </div>
              <ComboChart
                barSeries={view.migration.barSeries}
                lineSeries={view.migration.lineSeries}
                xAxisLabels={view.migration.xAxisLabels}
                yAxisFormatter={formatCompact}
                rightAxisFormatter={formatShareAxis}
                xAxisLabelInterval={view.labelInterval}
                markers={view.markers}
                height={CHART_HEIGHT}
                className="mt-3"
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
