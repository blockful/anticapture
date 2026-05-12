"use client";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { NAME_GROWTH_SERIES } from "@/features/revenue/data/mock";
import { formatCompact } from "@/features/revenue/utils/format";

export const NameGrowthChart = () => {
  return (
    <Card className="p-4">
      <p className="text-secondary mb-3 text-sm font-medium">
        Name Growth & Churn
      </p>
      <ComboChart
        barSeries={NAME_GROWTH_SERIES.barSeries}
        lineSeries={NAME_GROWTH_SERIES.lineSeries}
        xAxisLabels={NAME_GROWTH_SERIES.xAxisLabels}
        yAxisFormatter={formatCompact}
        height={300}
      />
    </Card>
  );
};
