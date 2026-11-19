"use client";

import { useMemo } from "react";
import { useGetRevenueNewWallets } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
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
          New .eth Registrants
        </p>
        <InfoTooltip>
          {paragraphs(
            "New registrants: each address is counted once, in the month it first becomes the owner of a newly registered .eth name (first paid registration on the v1 ETH registrar controllers, from May 2019, or on ENSv2). Renewals do not add wallets.",
            `Formula: bars = ${code("addresses whose first registration is in that month")}; line = ${code("running total of the bars")}`,
          )}
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
