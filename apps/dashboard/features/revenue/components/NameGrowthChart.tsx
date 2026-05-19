"use client";

import { useGetRevenueActiveNames } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { formatCompact } from "@/features/revenue/utils/format";
import { transformToNameGrowth } from "@/features/revenue/utils/transform";

export const NameGrowthChart = () => {
  const { data, isLoading } = useGetRevenueActiveNames("ens");
  const series = data ? transformToNameGrowth(data.items) : null;

  return (
    <Card className="p-4">
      <p className="text-secondary mb-3 text-sm font-medium">
        Name Growth & Churn
      </p>
      {isLoading ? (
        <div className="bg-surface-raised h-[300px] w-full animate-pulse rounded" />
      ) : series ? (
        <ComboChart
          barSeries={series.barSeries}
          lineSeries={series.lineSeries}
          xAxisLabels={series.xAxisLabels}
          yAxisFormatter={formatCompact}
          height={300}
        />
      ) : null}
    </Card>
  );
};
