"use client";

import { useState } from "react";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import {
  TokenDistributionChart,
  TokenDistributionMetrics,
} from "@/features/token-distribution/components";
import { ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { DaoIdEnum } from "@/shared/types/daos";
import { metricsSchema } from "@/features/token-distribution/utils";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";

export const TokenDistributionSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [hoveredMetricKey, setHoveredMetricKey] = useState<string | null>(null);
  const { metrics, setMetrics } = useTokenDistributionStore();

  const { chartData, chartConfig, isLoading } = useChartMetrics({
    appliedMetrics: metrics,
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
      <Card className="xl:border-light-dark xl:bg-surface-default xl4k:max-w-full flex flex-col gap-4 rounded-lg border-none shadow-none xl:max-w-full xl:flex-row xl:gap-0 xl:border">
        <CardContent className="order-2 flex h-full w-full flex-col gap-6 p-0 xl:order-1">
          <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium uppercase tracking-wide xl:gap-2.5">
            GOVERNANCE SUPPLY TRENDS
          </CardTitle>
          <TokenDistributionChart
            daoId={daoId}
            isLoading={isLoading}
            appliedMetrics={metrics}
            chartConfig={chartConfig}
            chartData={chartData}
            hoveredMetricKey={hoveredMetricKey}
          />
        </CardContent>
        <div className="border-light-dark mx-4 w-px border border-dashed xl:order-2" />
        <div className="order-1 w-full items-start xl:order-3 xl:w-[300px] xl:min-w-[300px] xl:max-w-[300px]">
          <TokenDistributionMetrics
            daoId={daoId}
            appliedMetrics={metrics}
            setAppliedMetrics={setMetrics}
            setHoveredMetricKey={setHoveredMetricKey}
            chartData={chartData}
          />
        </div>
      </Card>
    </TheSectionLayout>
  );
};
