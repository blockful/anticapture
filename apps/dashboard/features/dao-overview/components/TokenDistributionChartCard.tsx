"use client";

import {
  TokenDistributionChart,
  TokenDistributionMetrics,
} from "@/features/token-distribution/components";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import { metricsSchema } from "@/features/token-distribution/utils";
import { TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";

export const TokenDistributionChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const appliedTokenDistributionMetrics = [
    "DELEGATED_SUPPLY",
    "CEX_SUPPLY",
    "DEX_SUPPLY",
    "LENDING_SUPPLY",
  ];
  const {
    chartData: tokenDistributionChartData,
    chartConfig: tokenDistributionChartConfig,
    isLoading: isLoadingTokenDistributionChart,
  } = useChartMetrics({
    appliedMetrics: appliedTokenDistributionMetrics,
    daoId,
    metricsSchema,
  });
  return (
    <div
      className={"sm:bg-surface-default flex w-full flex-col gap-4 px-5 md:p-4"}
    >
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId?.toLowerCase()}/token-distribution`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          TOKEN DISTRIBUTION SUPPLY
        </DefaultLink>
        <TooltipInfo text="Token distribution metrics are based on Blockful's Governance Indexer and are updated daily based on the events and interaction with relevant contracts." />
      </div>
      <TokenDistributionChart
        daoId={daoId}
        isLoading={isLoadingTokenDistributionChart}
        appliedMetrics={appliedTokenDistributionMetrics}
        chartConfig={tokenDistributionChartConfig}
        chartData={tokenDistributionChartData}
        context="overview"
      />
      <TokenDistributionMetrics
        daoId={daoId}
        appliedMetrics={appliedTokenDistributionMetrics}
        setAppliedMetrics={() => {}}
        setHoveredMetricKey={() => {}}
        chartData={tokenDistributionChartData}
        context="overview"
      />
    </div>
  );
};
