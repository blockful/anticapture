"use client";

import { useMemo } from "react";
import { useGetRevenueActiveNames } from "@anticapture/client/hooks";

import { DeepLinkTitle } from "@/shared/components/deep-link";
import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";
import { deepLinkTarget } from "@/shared/utils/deepLink";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { REVENUE_ANCHORS } from "@/features/revenue/utils/anchors";
import {
  formatCompact,
  formatMonthLabel,
  formatUtcDate,
} from "@/features/revenue/utils/format";
import { UNAVAILABLE_TEXT } from "@/features/revenue/utils/meta";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import { transformToNameGrowth } from "@/features/revenue/utils/transform";

export const NameGrowthChart = () => {
  const activeNamesQuery = useGetRevenueActiveNames("ens");
  const activeNames = useRevenueDataState(activeNamesQuery);
  const { isLoading, isUnavailable, items, meta } = activeNames;
  // A month's row counts every name active at some point in it: a name only
  // leaves the count in the month after it expires. Name the latest row's
  // month, and the cutoff when the API reports it (older API: unknown).
  const latestMonth =
    items.length > 0 ? formatMonthLabel(items[items.length - 1].date) : null;
  const latestMonthText = latestMonth
    ? meta.asOf
      ? `in ${latestMonth} (data to ${formatUtcDate(meta.asOf)})`
      : `in ${latestMonth}, the latest month of data`
    : "in the latest month of data";
  const series = useMemo(
    () => (isLoading || isUnavailable ? null : transformToNameGrowth(items)),
    [isLoading, isUnavailable, items],
  );
  const activeNamesCount =
    isUnavailable || items.length === 0
      ? null
      : items[items.length - 1].cumulativeActive;

  return (
    <Card {...deepLinkTarget(REVENUE_ANCHORS.nameGrowth)} className="p-4">
      <DeepLinkTitle
        slug={REVENUE_ANCHORS.nameGrowth}
        info={
          <InfoTooltip>
            {paragraphs(
              `Active names are .eth names inside a registration term that was paid for, at some point in the month. The headline is the latest month, ${latestMonthText.replace(/^in /, "")}.`,
              `Formula: each registration adds ${code("+1")} in the month it starts and ${code("−1")} in the month after its paid term ends. Bars are the net change of the month; the line is the running total.`,
              `ENSv2 gave every v1 name 62 extra days on chain for free: ${code("ENSv2 expiry = paid term end + 62 days")}. They are not a paid term and are not counted here, so months stay comparable.`,
              "Renewing within the grace period continues the same registration. Names count from their first registrar-controller event (May 2019 onward).",
            )}
          </InfoTooltip>
        }
      >
        Name Growth & Churn
      </DeepLinkTitle>
      {!isLoading && (
        <p className="text-secondary mt-0.5 text-sm">
          {activeNamesCount !== null ? (
            <>
              <span className="font-medium" style={{ color: "#0080bc" }}>
                {formatCompact(activeNamesCount)}
              </span>{" "}
              active names {latestMonthText}
            </>
          ) : (
            <>{UNAVAILABLE_TEXT}: up-to-date active names are not available</>
          )}
        </p>
      )}
      {isLoading ? (
        <div className="bg-surface-raised mt-3 h-[300px] w-full animate-pulse rounded" />
      ) : isUnavailable ? (
        <UnavailableChart height={300} className="mt-3" />
      ) : series ? (
        <ComboChart
          barSeries={series.barSeries}
          lineSeries={series.lineSeries}
          xAxisLabels={series.xAxisLabels}
          yAxisFormatter={formatCompact}
          height={300}
          className="mt-3"
        />
      ) : null}
    </Card>
  );
};
