"use client";

import { TopAccountsChart } from "@/features/dao-overview/components/TopAccountsChart";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { SkeletonRow, TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";

import type { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

export const AccountBalanceChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { data: chartData, isLoading } = useTokenHolders(daoId, {
    orderBy: "variation",
    limit: 10,
    fromDay: TimeInterval.NINETY_DAYS,
  });

  return (
    <div className="lg:bg-surface-default flex w-full flex-col gap-4 px-5 lg:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/holders-and-delegates?days=90d&sortBy=variation`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          BIGGEST HOLDINGS CHANGE: LAST 90D ({daoId})
        </DefaultLink>
        <TooltipInfo text="Addresses with the highest number of governance tokens." />
      </div>
      {isLoading && <SkeletonRow className="h-52 w-full" />}
      {chartData && !isLoading && (
        <TopAccountsChart
          daoId={daoId}
          chartData={chartData}
          entityType="tokenHolder"
        />
      )}
    </div>
  );
};
