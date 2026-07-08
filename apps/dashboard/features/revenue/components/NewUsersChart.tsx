"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { useGetRevenueNewWallets } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";
import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

import { formatCompact } from "@/features/revenue/utils/format";
import { transformToNewWallets } from "@/features/revenue/utils/transform";

export const NewUsersChart = () => {
  const { data, isLoading } = useGetRevenueNewWallets("ens");
  const series = useMemo(
    () => (data ? transformToNewWallets(data.items) : null),
    [data],
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <p className="text-secondary text-sm font-medium">
          New Wallets Interacting with ENS
        </p>
        <Tooltip
          tooltipContent={
            <p className="text-secondary text-sm font-normal leading-5">
              First-time wallets to interact with ENS registrar contracts in the
              month (registration, renewal, or premium action). Cumulative line
              counts every unique wallet that has ever interacted.
            </p>
          }
          triggerClassName="inline-flex cursor-help items-center border-0 bg-transparent p-0"
        >
          <Info className="text-secondary size-3.5" />
        </Tooltip>
      </div>
      {isLoading ? (
        <Skeleton className="h-[300px] w-full rounded" />
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
