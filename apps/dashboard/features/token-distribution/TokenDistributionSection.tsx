"use client";

import {
  TheSectionLayout,
  SwitcherDate,
  TheCardChartLayout,
} from "@/shared/components";
import { TimeInterval } from "@/lib/enums";
import { DaoMetricsDayBucket } from "@/lib/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { mockedTokenMultineDatasets } from "@/lib/mocked-data/mocked-token-dist-datasets";
import {
  MultilineChartTokenDistribution,
  TokenDistributionTable,
} from "@/features/token-distribution/components";
import { ArrowLeftRight } from "@/shared/components/icons";
import { useTokenDistributionContext } from "@/features/token-distribution/contexts";

const chartConfig: Record<string, { label: string; color: string }> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#3B82F6",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "#FB923C",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "#22C55E",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "#A855F7",
  },
};

const ChartLegend = ({
  items,
}: {
  items: { color: string; label: string }[];
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-2">
        <span
          className="size-2 rounded-sm"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-sm font-medium text-foreground">
          {item.label}
        </span>
      </div>
    ))}
  </div>
);

export const TokenDistributionSection = () => {
  const {
    delegatedSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
    days,
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
      subtitle="Token Supply Distribution"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.ONE_YEAR}
          setTimeInterval={setDays}
          isSmall
        />
      }
      description={SECTIONS_CONSTANTS.tokenDistribution.description}
      anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
      days={days}
    >
      <TheCardChartLayout
        headerComponent={
          <div className="flex w-full items-center pt-3 sm:flex-row">
            <ChartLegend
              items={Object.values(chartConfig).map(({ label, color }) => ({
                label,
                color,
              }))}
            />
          </div>
        }
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
      </TheCardChartLayout>
      <div className="w-full border-t border-lightDark" />
      <TokenDistributionTable />
    </TheSectionLayout>
  );
};
