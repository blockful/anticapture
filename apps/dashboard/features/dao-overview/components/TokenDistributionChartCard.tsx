"use client";

import { TokenDistributionChart } from "@/features/token-distribution/components";
import { Metric } from "@/features/token-distribution/components/Metric";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import {
  MetricSchema,
  metricsSchema,
} from "@/features/token-distribution/utils";
import { TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";

export const TokenDistributionChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const overviewTokenDistributionMetrics = [
    MetricTypesEnum.DELEGATED_SUPPLY,
    MetricTypesEnum.CEX_SUPPLY,
    MetricTypesEnum.DEX_SUPPLY,
    MetricTypesEnum.LENDING_SUPPLY,
  ];
  const {
    chartData: tokenDistributionChartData,
    chartConfig: tokenDistributionChartConfig,
    isLoading: isLoadingTokenDistributionChart,
  } = useChartMetrics({
    appliedMetrics: overviewTokenDistributionMetrics,
    daoId,
    metricsSchema,
  });

  const overviewTokenDistributionMetricsSchema = Object.fromEntries(
    overviewTokenDistributionMetrics
      .map((key) => [key, metricsSchema[key as keyof typeof metricsSchema]])
      .filter(([, metric]) => !!metric),
  ) as Record<string, MetricSchema>;

  return (
    <div className="sm:bg-surface-default flex w-full flex-col gap-4 px-5 md:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/token-distribution`}
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
        appliedMetrics={overviewTokenDistributionMetrics}
        chartConfig={tokenDistributionChartConfig}
        chartData={tokenDistributionChartData}
        context="overview"
      />
      <div className="flex h-min gap-3">
        {Object.values(overviewTokenDistributionMetricsSchema).map(
          (metric: MetricSchema) => (
            <Metric
              key={metric.label}
              label={metric.label}
              color={metric.color}
              context="overview"
            />
          ),
        )}
      </div>
    </div>
  );
};
