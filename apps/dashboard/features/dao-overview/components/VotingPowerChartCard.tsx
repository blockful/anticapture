"use client";

import {
  QueryInput_VotingPowers_OrderBy,
  QueryInput_VotingPowers_OrderDirection,
} from "@anticapture/graphql-client";
import { useMemo } from "react";
import { formatUnits } from "viem";

import {
  TopAccountChartData,
  TopAccountsChart,
} from "@/features/dao-overview/components/TopAccountsChart";
import { useDelegates } from "@/features/holders-and-delegates/hooks/useDelegates";
import { SkeletonRow, TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

export const VotingPowerChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { data: delegatesData, loading } = useDelegates({
    daoId,
    orderBy: QueryInput_VotingPowers_OrderBy.Variation,
    orderDirection: QueryInput_VotingPowers_OrderDirection.Desc,
    limit: 10,
    days: TimeInterval.NINETY_DAYS,
    skipActivity: true,
  });

  const chartData: TopAccountChartData[] = useMemo(() => {
    if (!delegatesData) return [];

    return delegatesData
      .filter((item) => !!item)
      .map((item) => {
        const absoluteChange = Number(
          formatUnits(
            BigInt(item.variation.absoluteChange),
            daoConfig[daoId].decimals,
          ),
        );

        const percentageChange = Number(item.variation.percentageChange);

        const balance = Number(
          formatUnits(BigInt(item.votingPower), daoConfig[daoId].decimals),
        );

        return {
          address: item.accountId,
          value: absoluteChange,
          balance,
          delegationsCount: item.delegationsCount,
          variation: {
            absoluteChange,
            percentageChange,
          },
        };
      });
  }, [delegatesData, daoId]);

  return (
    <div className="lg:bg-surface-default flex w-full flex-col gap-4 px-5 lg:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/holders-and-delegates?days=90d&tab=delegates`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          BIGGEST DELEGATE CHANGE: LAST 90D ({daoId})
        </DefaultLink>
        <TooltipInfo text="Addresses with the most delegated votes." />
      </div>
      {loading && <SkeletonRow className="h-52 w-full" />}
      {!loading && (
        <TopAccountsChart
          daoId={daoId}
          chartData={chartData}
          entityType="delegate"
        />
      )}
    </div>
  );
};
