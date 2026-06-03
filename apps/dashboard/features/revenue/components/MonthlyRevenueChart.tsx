"use client";

import { useMemo, useState } from "react";
import { useGetRevenueTotals } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";

import type { ChartGranularity } from "@/features/revenue/types";
import { formatMillions } from "@/features/revenue/utils/format";
import { transformToStreamSeries } from "@/features/revenue/utils/transform";

const GRANULARITY_OPTIONS: { label: string; value: ChartGranularity }[] = [
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" },
];

const getXAxisLabelInterval = (granularity: ChartGranularity) => {
  if (granularity === "quarter") {
    return (_index: number, value: string) => value.startsWith("Q1");
  }
  if (granularity === "year") return 0;
  return undefined;
};

const formatXAxisLabel = (
  value: string,
  _index: number,
  granularity: ChartGranularity,
) => {
  if (granularity === "quarter") return value.split("'")[1] ?? value;
  return value;
};

export const MonthlyRevenueChart = () => {
  const [granularity, setGranularity] = useState<ChartGranularity>("quarter");
  const { data, isLoading } = useGetRevenueTotals("ens");
  const series = useMemo(
    () => (data ? transformToStreamSeries(data.items, granularity) : null),
    [data, granularity],
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-secondary text-sm font-medium">
          All Time Revenue by Stream
        </p>
        <div className="flex items-center gap-2">
          <span className="text-secondary hidden text-sm font-medium lg:inline">
            View
          </span>
          <SegmentedControl
            items={GRANULARITY_OPTIONS}
            value={granularity}
            size="sm"
            onValueChange={(value) => setGranularity(value as ChartGranularity)}
            className="hidden lg:inline-flex"
          />
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as ChartGranularity)}
            className="border-border-default bg-surface-default text-primary rounded-base border px-2 py-1 text-xs font-medium lg:hidden"
          >
            {GRANULARITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="bg-surface-raised h-[300px] w-full animate-pulse rounded" />
      ) : series ? (
        <StackedBarChart
          series={series.series}
          xAxisLabels={series.xAxisLabels}
          yAxisFormatter={formatMillions}
          xAxisLabelInterval={
            granularity === "month"
              ? undefined
              : getXAxisLabelInterval(granularity)
          }
          xAxisLabelFormatter={
            granularity === "month"
              ? undefined
              : (value, index) => formatXAxisLabel(value, index, granularity)
          }
          tooltipTotalLabel="Total"
          height={300}
        />
      ) : null}
    </Card>
  );
};
