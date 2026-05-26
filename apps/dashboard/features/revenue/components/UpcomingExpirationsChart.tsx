"use client";

import { useMemo } from "react";
import { useGetRevenueRenewalTenure } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";

import { formatCompact } from "@/features/revenue/utils/format";
import { transformToRenewalTenure } from "@/features/revenue/utils/transform";

export const UpcomingExpirationsChart = () => {
  const { data, isLoading } = useGetRevenueRenewalTenure("ens");
  const series = useMemo(
    () => (data ? transformToRenewalTenure(data.items) : null),
    [data],
  );

  // Target ~7 visible year labels regardless of how many months of data exist
  const xAxisInterval = series
    ? Math.max(11, Math.round(series.xAxisLabels.length / 7) - 1)
    : 11;

  return (
    <Card className="p-4">
      <p className="text-secondary text-sm font-medium">Upcoming Expirations</p>
      {!isLoading && series && (
        <p className="text-secondary mt-0.5 text-sm">
          <span className="font-medium" style={{ color: "#f87171" }}>
            {formatCompact(series.neverRenewedNext12mo)}
          </span>{" "}
          names with no prior renewals expiring in next 12 months
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
      ) : null}
    </Card>
  );
};
