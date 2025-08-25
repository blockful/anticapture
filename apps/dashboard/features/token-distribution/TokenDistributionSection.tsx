"use client";

import { useState, useEffect } from "react";
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
  initialMetrics,
  metricsSchema,
} from "@/features/token-distribution/utils";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";

/* TODO:

- [ ] The metrics should be applied in the url
- [ ] The metrics needs to be applied in the chart with multiple data-source differents
- [ ] I can storage the metrics in the local-storage to remember the user-preferences
- [ ] I need to transform the data to be used in one unique dataset.

*/

export const TokenDistributionSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [hoveredMetricKey, setHoveredMetricKey] = useState<string | null>(null);
  const { metrics, setMetrics } = useTokenDistributionStore();

  // Initialize store with initial metrics if empty
  useEffect(() => {
    if (metrics.length === 0) {
      setMetrics(initialMetrics);
    }
  }, [metrics.length, setMetrics]);

  const { chartData, chartConfig } = useChartMetrics({
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
      <Card className="sm:border-light-dark sm:bg-surface-default xl4k:max-w-full flex gap-4 rounded-lg border-none shadow-none sm:max-w-full sm:gap-0 sm:border">
        <CardContent className="flex h-full w-full flex-col gap-6 p-0">
          <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
            GOVERNANCE SUPPLY TRENDS (CAT)
          </CardTitle>
          <TokenDistributionChart
            appliedMetrics={metrics}
            chartConfig={chartConfig}
            chartData={chartData}
            hoveredMetricKey={hoveredMetricKey}
          />
        </CardContent>
        <div className="border-light-dark mx-4 w-px border-r border-dashed" />
        <div className="flex w-full max-w-72 items-start sm:flex-row">
          <TokenDistributionMetrics
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
