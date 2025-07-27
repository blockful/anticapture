"use client";

import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import {
  TokenDistributionChart,
  TokenDistributionMetrics,
} from "@/features/token-distribution/components";
import { ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { useState } from "react";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { useTimeSeriesData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import {
  initialMetrics,
  metricsSchema,
} from "@/features/token-distribution/utils";

export const TokenDistributionSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [hoveredMetricKey, setHoveredMetricKey] =
    useState<MetricTypesEnum | null>(null);
  const [appliedMetrics, setAppliedMetrics] =
    useState<MetricTypesEnum[]>(initialMetrics);

  const { data: timeSeriesData } = useTimeSeriesData(
    daoId,
    appliedMetrics,
    TimeInterval.ONE_YEAR,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  const chartData = appliedMetrics.reduce(
    (acc, metricKey) => {
      const metric = metricsSchema[metricKey];

      if (metric) {
        acc[metricKey] = metric;
      }

      return acc;
    },
    {} as typeof metricsSchema,
  );

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
            appliedMetrics={appliedMetrics}
            timeSeriesData={timeSeriesData}
            chartConfig={chartData}
            hoveredMetricKey={hoveredMetricKey}
          />
        </CardContent>
        <div className="border-light-dark mx-4 w-px border-r border-dashed" />
        <div className="flex w-full max-w-72 items-start sm:flex-row">
          <TokenDistributionMetrics
            appliedMetrics={appliedMetrics}
            setAppliedMetrics={setAppliedMetrics}
            metricsSchema={metricsSchema}
            setHoveredMetricKey={setHoveredMetricKey}
          />
        </div>
      </Card>
    </TheSectionLayout>
  );
};
