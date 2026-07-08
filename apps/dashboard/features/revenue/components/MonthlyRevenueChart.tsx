"use client";

import { useMemo, useState } from "react";
import { useGetRevenueTotals } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";

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
  if (granularity === "quarter") {
    const shortYear = value.split("'")[1];
    return shortYear ? `20${shortYear}` : value;
  }
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
          <Select
            items={GRANULARITY_OPTIONS}
            value={granularity}
            onValueChange={(value) => setGranularity(value as ChartGranularity)}
            className="w-28 lg:hidden"
            aria-label="Revenue chart granularity"
          />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-[300px] w-full rounded" />
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
