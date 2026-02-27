"use client";

import { QueryInput_AccountBalances_OrderBy } from "@anticapture/graphql-client";
import { useMemo } from "react";
import { formatUnits } from "viem";

import {
  TopAccountChartData,
  TopAccountsChart,
} from "@/features/dao-overview/components/TopAccountsChart";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { SkeletonRow, TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

export const AccountBalanceChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { data: tokenHoldersData, loading } = useTokenHolders({
    daoId,
    orderBy: QueryInput_AccountBalances_OrderBy.Variation,
    limit: 10,
    days: TimeInterval.NINETY_DAYS,
  });

  const chartData: TopAccountChartData[] = useMemo(() => {
    if (!tokenHoldersData) return [];

    return tokenHoldersData.map((item) => {
      const absoluteChange = Number(
        formatUnits(
          BigInt(item.variation?.absoluteChange || 0),
          daoConfig[daoId].decimals,
        ),
      );
      const percentageChange =
        item.variation?.percentageChange === PERCENTAGE_NO_BASELINE
          ? 0
          : Number(item.variation?.percentageChange || 0);

      const balance = Number(
        formatUnits(BigInt(item.balance || 0), daoConfig[daoId].decimals),
      );

      return {
        address: item.accountId,
        value: absoluteChange,
        balance,
        delegate: item.delegate,
        variation: {
          absoluteChange,
          percentageChange,
        },
      };
    });
  }, [tokenHoldersData, daoId]);

  return (
    <div className="lg:bg-surface-default flex w-full flex-col gap-4 px-5 lg:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/holders-and-delegates?days=90d`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          BIGGEST HOLDINGS CHANGE: LAST 90D ({daoId})
        </DefaultLink>
        <TooltipInfo text="Addresses with the highest number of governance tokens." />
      </div>
      {loading && <SkeletonRow className="h-52 w-full" />}
      {!loading && (
        <TopAccountsChart
          daoId={daoId}
          chartData={chartData}
          entityType="tokenHolder"
        />
      )}
    </div>
  );
};
