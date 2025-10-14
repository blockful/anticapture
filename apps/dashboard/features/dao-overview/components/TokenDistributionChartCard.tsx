"use client";

import { TokenDistributionChart } from "@/features/token-distribution/components";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import {
  MetricSchema,
  metricsSchema,
} from "@/features/token-distribution/utils";
import { TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";

const OVERVIEW_TOKEN_DISTRIBUTION_METRICS = [
  MetricTypesEnum.DELEGATED_SUPPLY,
  MetricTypesEnum.CEX_SUPPLY,
  MetricTypesEnum.DEX_SUPPLY,
  MetricTypesEnum.LENDING_SUPPLY,
];

const OverviewMetric = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="flex h-full w-min flex-col justify-between rounded-sm xl:flex-row xl:items-center xl:gap-2">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 xl:items-start xl:justify-start">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="rounded-xs size-2 shrink-0"
            style={{ backgroundColor: color }}
          />
          <p className="text-primary truncate text-sm font-normal">{label}</p>
        </div>
      </div>
    </div>
  );
};

export const TokenDistributionChartCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const {
    chartData: tokenDistributionChartData,
    chartConfig: tokenDistributionChartConfig,
    isLoading: isLoadingTokenDistributionChart,
  } = useChartMetrics({
    appliedMetrics: OVERVIEW_TOKEN_DISTRIBUTION_METRICS,
    daoId,
    metricsSchema,
  });

  const overviewTokenDistributionMetricsSchema = Object.fromEntries(
    OVERVIEW_TOKEN_DISTRIBUTION_METRICS.map((key) => [
      key,
      metricsSchema[key as keyof typeof metricsSchema],
    ]).filter(([, metric]) => !!metric),
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
        appliedMetrics={OVERVIEW_TOKEN_DISTRIBUTION_METRICS}
        chartConfig={tokenDistributionChartConfig}
        chartData={tokenDistributionChartData}
        context="overview"
      />
      <div className="flex h-min gap-3">
        {Object.values(overviewTokenDistributionMetricsSchema).map(
          (metric: MetricSchema) => (
            <OverviewMetric
              key={metric.label}
              label={metric.label}
              color={metric.color}
            />
          ),
        )}
      </div>
    </div>
  );
};
