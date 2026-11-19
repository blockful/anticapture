"use client";

import { useMemo } from "react";
import { useGetRevenueEnsv2Daily } from "@anticapture/client/hooks";

import { DeepLinkTitle } from "@/shared/components/deep-link";
import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";
import { cn } from "@/shared/utils/cn";
import { deepLinkTarget } from "@/shared/utils/deepLink";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { REVENUE_ANCHORS } from "@/features/revenue/utils/anchors";
import { formatCompact, formatUsd } from "@/features/revenue/utils/format";
import { UNAVAILABLE_TEXT } from "@/features/revenue/utils/meta";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import {
  ENSV2_REVENUE_BASIS,
  dailyLabelInterval,
  summarizeEnsv2,
  toEnsv2Markers,
  transformToEnsv2Migration,
  transformToEnsv2Revenue,
} from "@/features/revenue/utils/transform";

const CHART_HEIGHT = 260;

/**
 * The KPI tiles, in the order `summarizeEnsv2` returns the KPIs: the block
 * each one links to, and its title while the data is unavailable.
 */
const KPI_TILES = [
  { title: "Revenue since ENSv2", anchor: REVENUE_ANCHORS.ensv2Revenue },
  { title: "Names migrated", anchor: REVENUE_ANCHORS.ensv2NamesMigrated },
  {
    title: "New ENSv2 registrations",
    anchor: REVENUE_ANCHORS.ensv2Registrations,
  },
];
const KPI_COUNT = KPI_TILES.length;

/** The stacked chart shortens long axes to the year by default; days keep their label. */
const keepDayLabel = (label: string): string => label;

/** Right axis of the migration chart: a share of names, e.g. "3.5%". */
const formatShareAxis = (value: number): string =>
  `${Number(value.toFixed(2))}%`;

/**
 * ENSv2 since its launch, built from the same pieces as the rest of the
 * page: a KPI card like "Usage & Adoption", then two chart cards side by side
 * like the bottom row. The charts are daily, so a campaign or a protocol
 * change can be read against the days around it.
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

  const chartPlaceholder = isLoading ? (
    <div
      className="bg-surface-raised mt-2 w-full animate-pulse rounded"
      style={{ height: CHART_HEIGHT }}
    />
  ) : (
    <UnavailableChart height={CHART_HEIGHT} className="mt-2" />
  );

  return (
    <>
      {/* KPI card: same anatomy as the Usage & Adoption row */}
      <Card {...deepLinkTarget(REVENUE_ANCHORS.ensv2)}>
        <div className="border-border-default flex items-center justify-between gap-2 border-b p-4">
          <DeepLinkTitle
            slug={REVENUE_ANCHORS.ensv2}
            info={
              <InfoTooltip>
                {paragraphs(
                  "ENSv2 went live on Oct 27, 2026. Since then every registration and renewal is paid on ENSv2 contracts, in USDC or DAI, and v1 names can migrate to the ENSv2 registry.",
                  "These figures and the two charts below cover that period only, by UTC day. The launch day and the latest day are partial.",
                )}
              </InfoTooltip>
            }
          >
            ENSv2
          </DeepLinkTitle>
          {view && (
            <p className="text-secondary text-sm">
              Since launch · {view.summary.period}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {KPI_TILES.map((tile, index) => {
            const kpi = view?.summary.kpis[index];
            return (
              <div
                key={tile.anchor}
                {...deepLinkTarget(tile.anchor)}
                className={cn(
                  "p-4",
                  index < KPI_COUNT - 1 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                {isLoading ? (
                  <>
                    <div className="bg-surface-raised h-4 w-24 animate-pulse rounded" />
                    <div className="bg-surface-raised mt-2 h-9 w-20 animate-pulse rounded" />
                    <div className="bg-surface-raised mt-2 h-4 w-32 animate-pulse rounded" />
                  </>
                ) : kpi ? (
                  <>
                    <DeepLinkTitle
                      slug={tile.anchor}
                      info={<InfoTooltip>{kpi.tooltip}</InfoTooltip>}
                    >
                      {kpi.title}
                    </DeepLinkTitle>
                    <p className="text-primary mt-1 text-[30px] font-medium leading-9">
                      {kpi.value}
                    </p>
                    <p className="text-secondary mt-1 text-sm">{kpi.subtext}</p>
                  </>
                ) : (
                  <>
                    <DeepLinkTitle slug={tile.anchor}>
                      {tile.title}
                    </DeepLinkTitle>
                    <p className="text-secondary mt-1 text-[30px] font-medium leading-9">
                      {UNAVAILABLE_TEXT}
                    </p>
                    <p className="text-secondary mt-1 text-sm">
                      Up-to-date data is not available
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Chart cards: same anatomy as the bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          {...deepLinkTarget(REVENUE_ANCHORS.ensv2DailyRevenue)}
          className="p-4"
        >
          <DeepLinkTitle
            slug={REVENUE_ANCHORS.ensv2DailyRevenue}
            info={
              <InfoTooltip>
                {paragraphs(
                  ENSV2_REVENUE_BASIS,
                  `Formula: each bar = ${code("revenue of that UTC day")}, split by stream.`,
                  "The first and the latest bars are partial days.",
                )}
              </InfoTooltip>
            }
          >
            Daily Revenue Since ENSv2
          </DeepLinkTitle>
          <p className="text-secondary mt-0.5 text-sm">
            Revenue per day, by stream
          </p>
          {view ? (
            <StackedBarChart
              series={view.revenue.series}
              xAxisLabels={view.revenue.xAxisLabels}
              yAxisFormatter={formatUsd}
              xAxisLabelInterval={view.labelInterval}
              xAxisLabelFormatter={keepDayLabel}
              tooltipTotalLabel="Total"
              height={CHART_HEIGHT}
              className="mt-2"
            />
          ) : (
            chartPlaceholder
          )}
        </Card>

        <Card
          {...deepLinkTarget(REVENUE_ANCHORS.ensv2Migration)}
          className="p-4"
        >
          <DeepLinkTitle
            slug={REVENUE_ANCHORS.ensv2Migration}
            info={
              <InfoTooltip>
                {paragraphs(
                  "Bars are the v1 names migrated on each UTC day. The line is the share of eligible v1 names migrated so far (right axis).",
                  `Formula: ${code("names migrated since the launch ÷ eligible v1 names × 100")}`,
                  "Eligible names are the v1 names the protocol reserved in the ENSv2 registry before the launch. That list is fixed.",
                  "The first and the latest bars are partial days.",
                )}
              </InfoTooltip>
            }
          >
            Migration to ENSv2
          </DeepLinkTitle>
          <p className="text-secondary mt-0.5 text-sm">
            Names migrated per day and share migrated so far
          </p>
          {view ? (
            <ComboChart
              barSeries={view.migration.barSeries}
              lineSeries={view.migration.lineSeries}
              xAxisLabels={view.migration.xAxisLabels}
              yAxisFormatter={formatCompact}
              rightAxisFormatter={formatShareAxis}
              xAxisLabelInterval={view.labelInterval}
              markers={view.markers}
              height={CHART_HEIGHT}
              className="mt-2"
            />
          ) : (
            chartPlaceholder
          )}
        </Card>
      </div>
    </>
  );
};
