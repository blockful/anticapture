"use client";

import { useMemo } from "react";
import { useGetRevenueTotals } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";

import { formatMillions } from "@/features/revenue/utils/format";
import { transformToMonthlySeries } from "@/features/revenue/utils/transform";

export const MonthlyRevenueChart = () => {
  const { data, isLoading } = useGetRevenueTotals("ens");
  const series = useMemo(
    () => (data ? transformToMonthlySeries(data.items) : null),
    [data],
  );

  return (
    <Card className="p-4">
      <p className="text-secondary mb-3 text-sm font-medium">
        Monthly Revenue by Stream
      </p>
      {isLoading ? (
        <div className="bg-surface-raised h-[300px] w-full animate-pulse rounded" />
      ) : series ? (
        <StackedBarChart
          series={series.series}
          xAxisLabels={series.xAxisLabels}
          yAxisFormatter={formatMillions}
          tooltipTotalLabel="Total"
          height={300}
        />
      ) : null}
    </Card>
  );
};
