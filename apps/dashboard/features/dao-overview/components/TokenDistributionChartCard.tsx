"use client";

import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

import { OverviewMetric } from "@/features/dao-overview/components/OverviewMetric";
import { TokenDistributionChart } from "@/features/token-distribution/components";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import type { MetricSchema } from "@/features/token-distribution/utils";
import {
  initialMetrics,
  metricsSchema,
} from "@/features/token-distribution/utils";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import { TooltipInfo } from "@/shared/components/tooltips/TooltipInfo";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { Stage } from "@/shared/types/enums/Stage";

export const TokenDistributionChartCard = ({
  daoId,
  currentDaoStage,
}: {
  daoId: DaoIdEnum;
  currentDaoStage?: Stage;
}) => {
  const router = useRouter();
  const { decimals } = daoConfig[daoId];

  const OVERVIEW_TOKEN_DISTRIBUTION_METRICS = daoConfig[daoId]
    .notSupportedMetrics
    ? initialMetrics.filter(
        (metric) => !daoConfig[daoId].notSupportedMetrics?.includes(metric),
      )
    : initialMetrics;

  const {
    chartData: tokenDistributionChartData,
    chartConfig: tokenDistributionChartConfig,
    isLoading: isLoadingTokenDistributionChart,
  } = useChartMetrics({
    appliedMetrics: OVERVIEW_TOKEN_DISTRIBUTION_METRICS,
    daoId,
    metricsSchema,
    decimals,
  });

  const overviewTokenDistributionMetricsSchema = Object.fromEntries(
    OVERVIEW_TOKEN_DISTRIBUTION_METRICS.map((key) => [
      key,
      metricsSchema[key as keyof typeof metricsSchema],
    ]).filter(([, metric]) => !!metric),
  ) as Record<string, MetricSchema>;

  return (
    <div className="lg:bg-surface-default flex w-full flex-col gap-4 px-5 lg:p-4">
      <div className="flex h-5 items-center gap-2">
        <Button
          variant="link"
          onClick={() =>
            router.push(`${daoId.toLowerCase()}/token-distribution`)
          }
          className="font-mono text-[13px] font-medium tracking-wider"
        >
          TOKEN DISTRIBUTION SUPPLY
        </Button>
        <TooltipInfo text="Token distribution metrics are based on Blockful's Governance Indexer and are updated daily based on the events and interaction with relevant contracts." />
      </div>
      {currentDaoStage === Stage.UNKNOWN ? (
        <EmptyState
          title="REVIEW NEEDED"
          description="Review required to complete integration and start extracting deeper insights from this DAO."
          icon={<CounterClockwiseClockIcon className="text-secondary size-8" />}
          classNames="bg-surface-contrast"
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};
