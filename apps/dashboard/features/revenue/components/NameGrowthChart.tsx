"use client";

import { useMemo } from "react";
import { useGetRevenueActiveNames } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { formatCompact } from "@/features/revenue/utils/format";
import { transformToNameGrowth } from "@/features/revenue/utils/transform";

export const NameGrowthChart = () => {
  const { data, isLoading } = useGetRevenueActiveNames("ens");
  const series = useMemo(
    () => (data ? transformToNameGrowth(data.items) : null),
    [data],
  );
  const activeNamesCount = useMemo(() => {
    if (!data || data.items.length === 0) return null;
    return data.items[data.items.length - 1].cumulativeActive;
  }, [data]);

  return (
    <Card className="p-4">
      <p className="text-secondary text-sm font-medium">Name Growth & Churn</p>
      {!isLoading && activeNamesCount !== null && (
        <p className="text-secondary mt-0.5 text-sm">
          <span className="font-medium" style={{ color: "#0080bc" }}>
            {formatCompact(activeNamesCount)}
          </span>{" "}
          active names now
        </p>
      )}
      {isLoading ? (
        <div className="bg-surface-raised mt-3 h-[300px] w-full animate-pulse rounded" />
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
