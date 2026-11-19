"use client";

import { useMemo } from "react";
import { useGetRevenueRenewalTenure } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { formatCompact } from "@/features/revenue/utils/format";
import { UNAVAILABLE_TEXT } from "@/features/revenue/utils/meta";
import { transformToRenewalTenure } from "@/features/revenue/utils/transform";

export const UpcomingExpirationsChart = () => {
  const tenureQuery = useGetRevenueRenewalTenure("ens");
  // Rows are keyed by future expiry months, so without asOf the cutoff falls
  // back to the viewer's clock rather than the latest row.
  const tenure = useRevenueDataState(tenureQuery, "clock");
  const { isLoading, isUnavailable, items, cutoff, cutoffKnown } = tenure;
  // An empty or degraded response must never read as "0 names expiring".
  const series = useMemo(
    () =>
      isLoading || isUnavailable
        ? null
        : transformToRenewalTenure(items, cutoff),
    [isLoading, isUnavailable, items, cutoff],
  );

  // Target ~7 visible year labels regardless of how many months of data exist
  const xAxisInterval = series
    ? Math.max(11, Math.round(series.xAxisLabels.length / 7) - 1)
    : 11;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-secondary text-sm font-medium">
          Upcoming Expirations
        </p>
        <InfoTooltip>
          .eth names grouped by the month their current registration expires,
          split by how many times they have been renewed since that registration
          began. The headline counts names not renewed since their current
          registration began and not yet expired at the data cutoff that expire
          in the 12 calendar months starting with{" "}
          {cutoffKnown ? "the data cutoff's month" : "the current month"}
          {series ? ` (${series.next12moPeriod})` : ""}.
        </InfoTooltip>
      </div>
      {!isLoading && (
        <p className="text-secondary mt-0.5 text-sm">
          {series ? (
            <>
              <span className="font-medium" style={{ color: "#f87171" }}>
                {formatCompact(series.neverRenewedNext12mo)}
              </span>{" "}
              names not renewed in their current registration, expiring in next
              12 months
            </>
          ) : (
            <>{UNAVAILABLE_TEXT}: up-to-date expiration data is not available</>
          )}
        </p>
      )}
      {isLoading ? (
        <div className="bg-surface-raised mt-2 h-[260px] w-full animate-pulse rounded" />
      ) : series ? (
        <StackedBarChart
          series={series.series}
          xAxisLabels={series.xAxisLabels}
          yAxisFormatter={formatCompact}
          xAxisLabelInterval={xAxisInterval}
          gridRight={32}
          height={260}
          className="mt-2"
        />
      ) : (
        <UnavailableChart height={260} className="mt-2" />
      )}
    </Card>
  );
};
