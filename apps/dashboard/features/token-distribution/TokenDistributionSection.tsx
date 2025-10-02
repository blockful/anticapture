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
import { ArrowRightLeft } from "lucide-react";
import { getDateRange } from "@/shared/utils";

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

type CsvRow = Record<string, number | string | null>;

const buildCsvData = (
  datasets: Record<string, DaoMetricsDayBucket[] | undefined>,
): CsvRow[] => {
  const rows: CsvRow[] = [];

  Object.entries(datasets).forEach(([key, data]) => {
    data?.forEach((point) => {
      const { date, high } = point;
      if (!date) return;
      const row = rows.find((r) => r.date === date);

      if (!row) {
        rows.push({
          date,
          [key]: high,
        });
        return;
      }

      row[key] = high;
    });
  });

  return rows.sort(
    (a, b) =>
      new Date(a.date as string).getTime() -
      new Date(b.date as string).getTime(),
  );
};

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
      icon={<ArrowRightLeft className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.tokenDistribution.description}
      anchorId={SECTIONS_CONSTANTS.tokenDistribution.anchorId}
      days={days}
    >
      <TheCardChartLayout
        title="Token Supply Distribution"
        subtitle={getDateRange(days ?? "")}
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
        switcherComponent={
          <SwitcherDate
            defaultValue={TimeInterval.ONE_YEAR}
            setTimeInterval={setDays}
            isSmall
          />
        }
        csvData={buildCsvData(datasets)}
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
      <div className="border-light-dark w-full border-t" />
      <TokenDistributionTable />
    </TheSectionLayout>
  );
};
