"use client";

import { useState, useMemo } from "react";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import {
  TokenDistributionChart,
  TokenDistributionMetrics,
} from "@/features/token-distribution/components";
import { ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  metricsSchema,
  initialMetrics,
} from "@/features/token-distribution/utils";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";

export const TokenDistributionSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [hoveredMetricKey, setHoveredMetricKey] = useState<string | null>(null);
  const { metrics, setMetrics } = useTokenDistributionStore();

  // Use initial metrics as fallback when no metrics are selected
  const memoizedMetrics = useMemo(() => {
    return metrics.length > 0 ? metrics : initialMetrics;
  }, [metrics]);

  const { chartData, chartConfig, isLoading } = useChartMetrics({
    appliedMetrics: memoizedMetrics,
    daoId,
    metricsSchema,
  });

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.tokenDistribution.title}
      icon={<ArrowRightLeft className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.tokenDistribution.description}
      anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
    >
      <Card className="sm:border-light-dark sm:bg-surface-default xl4k:max-w-full flex flex-col gap-4 rounded-lg border-none shadow-none sm:max-w-full sm:gap-0 sm:border md:flex-row">
        <CardContent className="order-2 flex h-full w-full flex-col gap-6 p-0 sm:order-1">
          <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
            GOVERNANCE SUPPLY TRENDS ({daoId})
          </CardTitle>
          <TokenDistributionChart
            isLoading={isLoading}
            appliedMetrics={memoizedMetrics}
            chartConfig={chartConfig}
            chartData={chartData}
            hoveredMetricKey={hoveredMetricKey}
          />
        </CardContent>
        <div className="border-light-dark mx-4 w-px border border-dashed sm:order-2" />
        <div className="order-1 w-full items-start sm:order-3 sm:w-fit sm:min-w-[300px]">
          <TokenDistributionMetrics
            appliedMetrics={memoizedMetrics}
            setAppliedMetrics={setMetrics}
            setHoveredMetricKey={setHoveredMetricKey}
            chartData={chartData}
          />
        </div>
      </Card>
    </TheSectionLayout>
  );
};
