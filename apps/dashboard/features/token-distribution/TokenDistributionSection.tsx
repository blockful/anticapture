"use client";

import { TheSectionLayout } from "@/shared/components";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { mockedTokenMultineDatasets } from "@/shared/constants/mocked-data/mocked-token-dist-datasets";
import {
  MultilineChartTokenDistribution,
  ChartMetrics,
} from "@/features/token-distribution/components";
import { useTokenDistributionContext } from "@/features/token-distribution/contexts";
import { ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { useState } from "react";

const initialChartConfig: Record<
  string,
  { label: string; color: string; category: string }
> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#3B82F6",
    category: "SUPPLY",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "#FB923C",
    category: "SUPPLY",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "#22C55E",
    category: "SUPPLY",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "#A855F7",
    category: "SUPPLY",
  },
};
const allMetrics: Record<
  string,
  { label: string; color: string; category: string }
> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#3B82F6",
    category: "SUPPLY",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "#FB923C",
    category: "SUPPLY",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "#22C55E",
    category: "SUPPLY",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "#A855F7",
    category: "SUPPLY",
  },
};

export const TokenDistributionSection = () => {
  const {
    delegatedSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
  } = useTokenDistributionContext();

  const [appliedMetrics, setAppliedMetrics] =
    useState<
      Record<string, { label: string; color: string; category: string }>
    >(initialChartConfig);

  const datasets: Record<string, DaoMetricsDayBucket[] | undefined> = {
    delegatedSupply: delegatedSupplyChart,
    cexSupply: cexSupplyChart,
    dexSupply: dexSupplyChart,
    lendingSupply: lendingSupplyChart,
  };

  const filterData = Object.keys(appliedMetrics);

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
          {Object.values(datasets).some((value) => value!.length > 0) ? (
            <MultilineChartTokenDistribution
              datasets={datasets}
              chartConfig={initialChartConfig}
              filterData={filterData}
            />
          ) : (
            <MultilineChartTokenDistribution
              datasets={mockedTokenMultineDatasets}
              chartConfig={initialChartConfig}
              filterData={filterData}
              mocked={true}
            />
          )}
        </CardContent>
        <div className="border-light-dark mx-4 w-px border-r border-dashed" />
        <div className="flex w-full max-w-72 items-start sm:flex-row">
          <ChartMetrics
            appliedMetrics={appliedMetrics}
            setAppliedMetrics={setAppliedMetrics}
            allMetrics={allMetrics}
          />
        </div>
      </Card>
      {/* <TokenDistributionTable /> */}
    </TheSectionLayout>
  );
};
