"use client";

import {
  TheSectionLayout,
  SwitcherDate,
  TheCardChartLayout,
} from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { mockedTokenMultineDatasets } from "@/shared/constants/mocked-data/mocked-token-dist-datasets";
import {
  MultilineChartTokenDistribution,
  TokenDistributionTable,
} from "@/features/token-distribution/components";
import { useTokenDistributionContext } from "@/features/token-distribution/contexts";
import { ArrowRightLeft, DownloadIcon } from "lucide-react";
import { convertToCSV, downloadCSV } from "@/shared/utils/formatDatasetsToCSV";

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
          className="rounded-xs size-2"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-secondary text-sm font-medium">{item.label}</span>
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

  const handleDownload = () => {
    const normalize = (data?: DaoMetricsDayBucket[]) =>
      data?.map((d) => ({
        date: d.date,
        value: String(d.high),
      }));

    const normalizedDatasets = {
      delegatedSupply: normalize(delegatedSupplyChart),
      cexSupply: normalize(cexSupplyChart),
      dexSupply: normalize(dexSupplyChart),
      lendingSupply: normalize(lendingSupplyChart),
    };

    const csv = convertToCSV(
      normalizedDatasets as Record<
        string,
        { date: string; value: string }[] | undefined
      >,
      chartConfig,
    );
    downloadCSV(csv, "token_distribution.csv");
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.tokenDistribution.title}
      subtitle="Token Supply Distribution"
      icon={<ArrowRightLeft className="section-layout-icon" />}
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
        <p className="text-secondary mt-2 flex font-mono text-xs tracking-wider">
          [DOWNLOAD AS{" "}
          <button
            onClick={handleDownload}
            className="text-link hover:text-link-hover ml-2 flex cursor-pointer items-center gap-1"
          >
            CSV <DownloadIcon className="size-3.5" />
          </button>
          ]
        </p>
      </TheCardChartLayout>
      <div className="border-light-dark w-full border-t" />
      <TokenDistributionTable />
    </TheSectionLayout>
  );
};
