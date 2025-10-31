"use client";

import { useMemo } from "react";
import { formatEther } from "viem";
import { SkeletonRow, TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  TopAccountChartData,
  TopAccountsChart,
} from "@/features/dao-overview/components/TopAccountsChart";
import { useAccountBalanceVariations } from "@/features/dao-overview/hooks/useAccountBalanceVariations";
import { TimeInterval } from "@/shared/types/enums";

export const AccountBalanceChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const accountBalanceVariations = useAccountBalanceVariations(
    daoId,
    TimeInterval.NINETY_DAYS,
  );

  const chartData: TopAccountChartData[] = useMemo(() => {
    const rawItems = accountBalanceVariations.data?.items ?? [];

    return rawItems.map((item) => {
      const absoluteChange = Number(
        formatEther(BigInt(item?.absoluteChange || 0)),
      );
      const percentageChange =
        item?.percentageChange === "NO BASELINE"
          ? 0
          : Number(item?.percentageChange);
      const balance = Number(formatEther(BigInt(item?.currentBalance || 0)));

      return {
        address: item?.accountId || "",
        value: absoluteChange,
        balance,
        variation: {
          absoluteChange,
          percentageChange,
        },
      };
    });
  }, [accountBalanceVariations.data]);

  return (
    <div className="sm:bg-surface-default flex w-full flex-col gap-4 px-5 md:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/holders-and-delegates`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          BIGGEST HOLDINGS CHANGE: LAST 90D ({daoId})
        </DefaultLink>
        <TooltipInfo text="Addresses with the highest number of governance tokens." />
      </div>
      {accountBalanceVariations.loading && (
        <SkeletonRow className="h-52 w-full" />
      )}
      {!accountBalanceVariations.loading && (
        <TopAccountsChart
          daoId={daoId}
          chartData={chartData}
          entityType="tokenHolder"
        />
      )}
    </div>
  );
};
