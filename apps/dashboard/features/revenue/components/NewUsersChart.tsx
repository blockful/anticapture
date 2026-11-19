"use client";

import { useMemo } from "react";
import { useGetRevenueNewWallets } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { formatCompact } from "@/features/revenue/utils/format";
import { transformToNewWallets } from "@/features/revenue/utils/transform";

export const NewUsersChart = () => {
  const newWalletsQuery = useGetRevenueNewWallets("ens");
  const newWallets = useRevenueDataState(newWalletsQuery);
  const { isLoading, isUnavailable, items } = newWallets;
  const series = useMemo(
    () => (isLoading || isUnavailable ? null : transformToNewWallets(items)),
    [isLoading, isUnavailable, items],
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <p className="text-secondary text-sm font-medium">
          New Wallets Interacting with ENS
        </p>
        <InfoTooltip>
          First-time wallets: each wallet is counted once, in the month it first
          sent a registration or renewal transaction to a .eth registrar
          controller (May 2019 onward). The wallet is the transaction sender,
          not necessarily the name owner. The cumulative line counts every
          wallet seen so far.
        </InfoTooltip>
      </div>
      {isLoading ? (
        <div className="bg-surface-raised h-[300px] w-full animate-pulse rounded" />
      ) : isUnavailable ? (
        <UnavailableChart height={300} />
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
