"use client";

import { TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  TopAccountChartData,
  TopAccountsChart,
} from "@/features/dao-overview/components/TopAccountsChart";
import { formatEther } from "viem";
import { TimeInterval } from "@/shared/types/enums";
import { useMemo } from "react";
import { useVotingPowerVariations } from "@/features/dao-overview/hooks/useVotingPowerVariations";

export const VotingPowerChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const votingPowerVariations = useVotingPowerVariations(
    daoId,
    TimeInterval.NINETY_DAYS,
  );

  const chartData: TopAccountChartData[] = useMemo(() => {
    const rawItems = votingPowerVariations.data?.items ?? [];

    return rawItems.map((item) => {
      const absoluteChange = Number(
        formatEther(BigInt(item?.absoluteChange || 0)),
      );
      const percentageChange =
        item?.percentageChange === "NO BASELINE"
          ? 0
          : Number(item?.percentageChange);
      const balance = Number(
        formatEther(BigInt(item?.currentVotingPower || 0)),
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
  }, [votingPowerVariations.data]);

  return (
    <div className="sm:bg-surface-default flex w-full flex-col gap-4 px-5 md:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/holders-and-delegates`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          BIGGEST DELEGATE CHANGE: LAST 90D ({daoId})
        </DefaultLink>
        <TooltipInfo text="Addresses with the most delegated votes." />
      </div>
      <TopAccountsChart
        daoId={daoId}
        chartData={chartData}
        entityType="delegate"
      />
    </div>
  );
};
