"use client";

import {
  ArrowLeftRight,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/atoms";
import {
  MultilineChartTokenDistribution,
  TokenDistributionTable,
} from "@/components/molecules";
import { useTokenDistributionContext } from "@/contexts";
import { TimeInterval } from "@/lib/enums";
import { DaoMetricsDayBucket } from "@/lib/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { mockedTokenMultineDatasets } from "@/lib/mocked-data/mocked-token-dist-datasets";

const chartConfig: Record<string, { label: string; color: string }> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#1E88E5",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "#FF9800",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "#43A047",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "#9C27B0",
  },
};

export const TokenDistributionSection = () => {
  const {
    delegatedSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
    setDays,
  } = useTokenDistributionContext();

  const datasets: Record<string, DaoMetricsDayBucket[] | undefined> = {
    delegatedSupply: delegatedSupplyChart,
    cexSupply: cexSupplyChart,
    dexSupply: dexSupplyChart,
    lendingSupply: lendingSupplyChart,
  };
  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.tokenDistribution.title}
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.ONE_YEAR}
          setTimeInterval={setDays}
        />
      }
      description={SECTIONS_CONSTANTS.tokenDistribution.description}
      anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
      className="border-b-2 border-b-white/10 px-4 py-8 sm:px-0 sm:py-0"
    >
      {Object.values(datasets).some((value) => value!.length > 0) ? (
        <MultilineChartTokenDistribution
          datasets={datasets}
          chartConfig={chartConfig}
        />
      ) : (
        <MultilineChartTokenDistribution
          datasets={mockedTokenMultineDatasets}
          chartConfig={chartConfig}
          mocked={true}
        />
      )}
      <TokenDistributionTable />
    </TheSectionLayout>
  );
};
