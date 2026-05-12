"use client";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";

import { UPCOMING_EXPIRATIONS_SERIES } from "@/features/revenue/data/mock";
import { formatCompact } from "@/features/revenue/utils/format";

export const UpcomingExpirationsChart = () => {
  return (
    <Card className="p-4">
      <p className="text-secondary text-sm font-medium">Upcoming Expirations</p>
      <p className="text-secondary mt-0.5 text-sm">
        <span className="font-medium" style={{ color: "#0080bc" }}>
          629K
        </span>{" "}
        names expire in the next 24 months
      </p>
      <StackedBarChart
        series={UPCOMING_EXPIRATIONS_SERIES.series}
        xAxisLabels={UPCOMING_EXPIRATIONS_SERIES.xAxisLabels}
        yAxisFormatter={formatCompact}
        height={260}
        className="mt-2"
      />
    </Card>
  );
};
