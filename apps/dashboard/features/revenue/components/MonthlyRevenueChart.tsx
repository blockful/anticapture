"use client";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";

import { MONTHLY_REVENUE_SERIES } from "@/features/revenue/data/mock";
import { formatMillions } from "@/features/revenue/utils/format";

export const MonthlyRevenueChart = () => {
  return (
    <Card className="p-4">
      <p className="text-secondary mb-3 text-sm font-medium">
        Monthly Revenue by Stream
      </p>
      <StackedBarChart
        series={MONTHLY_REVENUE_SERIES.series}
        xAxisLabels={MONTHLY_REVENUE_SERIES.xAxisLabels}
        yAxisFormatter={formatMillions}
        height={300}
      />
    </Card>
  );
};
