"use client";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { NEW_USERS_SERIES } from "@/features/revenue/data/mock";
import { formatCompact } from "@/features/revenue/utils/format";

export const NewUsersChart = () => {
  return (
    <Card className="p-4">
      <p className="text-secondary mb-3 text-sm font-medium">
        New Wallets Interacting with ENS
      </p>
      <ComboChart
        barSeries={NEW_USERS_SERIES.barSeries}
        lineSeries={NEW_USERS_SERIES.lineSeries}
        xAxisLabels={NEW_USERS_SERIES.xAxisLabels}
        yAxisFormatter={formatCompact}
        height={300}
      />
    </Card>
  );
};
