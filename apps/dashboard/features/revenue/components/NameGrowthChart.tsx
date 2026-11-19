"use client";

import { useMemo } from "react";
import { useGetRevenueActiveNames } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import {
  formatCompact,
  formatMonthLabel,
  formatUtcDate,
} from "@/features/revenue/utils/format";
import { UNAVAILABLE_TEXT } from "@/features/revenue/utils/meta";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import { transformToNameGrowth } from "@/features/revenue/utils/transform";

/**
 * ENSv2 moved every v1 expiry 62 days later, so no name leaves the count in
 * Oct or Nov 2026. Marked on the chart so those bars are not read as growth.
 */
const ENSV2_EXPIRY_SHIFT = {
  month: "Oct 2026",
  label: "ENSv2: expiries +62 days",
};

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
  const expiryShiftMarker = useMemo(() => {
    const index = series?.xAxisLabels.indexOf(ENSV2_EXPIRY_SHIFT.month) ?? -1;
    return index === -1 ? [] : [{ index, label: ENSV2_EXPIRY_SHIFT.label }];
  }, [series]);
  const activeNamesCount =
    isUnavailable || items.length === 0
      ? null
      : items[items.length - 1].cumulativeActive;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-secondary text-sm font-medium">
          Name Growth & Churn
        </p>
        <InfoTooltip>
          {paragraphs(
            `Active names are .eth names whose registration was active at some point in the month. A name leaves the count in the month after it expires, so the headline counts names active at some point ${latestMonthText}, including names that expired during it.`,
            `Formula: each registration adds ${code("+1")} in the month it starts and ${code("−1")} in the month after it expires. Bars are the net change of the month; the line is the running total.`,
            `ENSv2 effect: at the launch (Oct 27, 2026) every v1 name got a later expiry, ${code("ENSv2 expiry = v1 expiry + 62 days")}. Names that were due to expire from Sep 2026 onward leave the count two months later than they would have. No name leaves in Oct or Nov 2026, so those bars equal the registrations of the month. They are not organic growth; names start leaving again in Dec 2026.`,
            "Renewing or re-registering within the grace period continues the same registration: 28 days after the ENSv2 expiry, which for names registered before ENSv2 is 90 days after their v1 expiry.",
            "Names count from their first registrar-controller event (May 2019 onward), so names from the 2017 auction appear once renewed through a controller.",
          )}
        </InfoTooltip>
      </div>
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
          markers={expiryShiftMarker}
          height={300}
          className="mt-3"
        />
      ) : null}
    </Card>
  );
};
