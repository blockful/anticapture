"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { SkeletonRow, TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  TopAccountChartData,
  TopAccountsChart,
} from "@/features/dao-overview/components/TopAccountsChart";
import { useAccountBalanceVariations } from "@/features/dao-overview/hooks/useAccountBalanceVariations";
import { TimeInterval } from "@/shared/types/enums";
import daoConfig from "@/shared/dao-config";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";

export const AccountBalanceChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const accountBalanceVariations = useAccountBalanceVariations(
    daoId,
    TimeInterval.NINETY_DAYS,
  );

  const chartData: TopAccountChartData[] = useMemo(() => {
    const rawItems = accountBalanceVariations.data?.items ?? [];

    return rawItems.map((item) => {
      const absoluteChange = Number(
        formatUnits(
          BigInt(item?.absoluteChange || 0),
          daoConfig[daoId].decimals,
        ),
      );
      const percentageChange =
        item?.percentageChange === PERCENTAGE_NO_BASELINE
          ? 0
          : Number(item?.percentageChange);

      const balance = Number(
        formatUnits(
          BigInt(item?.currentBalance || 0),
          daoConfig[daoId].decimals,
        ),
      );

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
  }, [accountBalanceVariations.data, daoId]);

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
