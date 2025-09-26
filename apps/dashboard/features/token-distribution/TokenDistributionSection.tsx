"use client";

import { TheSectionLayout } from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { mockedTokenMultineDatasets } from "@/shared/constants/mocked-data/mocked-token-dist-datasets";
import {
  MultilineChartTokenDistribution,
  TokenDistributionTable,
} from "@/features/token-distribution/components";
import { ArrowRightLeft } from "lucide-react";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { SwitcherDateMobile } from "@/shared/components/switchers/SwitcherDateMobile";
import { getDateRange } from "@/shared/utils";
import { useState } from "react";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricData } from "@/shared/contexts";
import { useTimeSeriesData } from "@/shared/hooks";
import { useParams } from "next/navigation";
import { formatUnits } from "viem";

export const calculateChangeRate = (
  data: DaoMetricsDayBucket[] = [],
): string | null => {
  if (!data || data.length < 2) return null;

  try {
    if (data.length > 0) {
      const oldHigh = data[0].high ?? "0";
      const currentHigh = data[data.length - 1]?.high ?? "0";
      if (currentHigh === "0") {
        return "0";
      } else {
        return formatUnits(
          (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) - BigInt(1e18),
          18,
        );
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

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
export interface TokenDistributionContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  totalSupply: MetricData;
  totalSupplyChart: DaoMetricsDayBucket[];
  circulatingSupply: MetricData;
  circulatingSupplyChart: DaoMetricsDayBucket[];
  delegatedSupply: MetricData;
  delegatedSupplyChart: DaoMetricsDayBucket[];
  cexSupply: MetricData;
  cexSupplyChart: DaoMetricsDayBucket[];
  dexSupply: MetricData;
  dexSupplyChart: DaoMetricsDayBucket[];
  lendingSupply: MetricData;
  lendingSupplyChart: DaoMetricsDayBucket[];
}

export const TokenDistributionSection = () => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.ONE_YEAR);

  const { daoId } = useParams();
  const daoIdEnum = daoId as DaoIdEnum;

  const metricTypes = [
    MetricTypesEnum.TOTAL_SUPPLY,
    MetricTypesEnum.CIRCULATING_SUPPLY,
    MetricTypesEnum.DELEGATED_SUPPLY,
    MetricTypesEnum.CEX_SUPPLY,
    MetricTypesEnum.DEX_SUPPLY,
    MetricTypesEnum.LENDING_SUPPLY,
  ];

  const { data: timeSeriesData } = useTimeSeriesData(
    daoIdEnum,
    metricTypes,
    days,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  const value: TokenDistributionContextProps = {
    days,
    setDays,
    totalSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY],
      ),
    },
    totalSupplyChart: timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY] || [],
    circulatingSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY]?.at(-1)?.high ??
        null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY],
      ),
    },
    circulatingSupplyChart:
      timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY] || [],
    delegatedSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY]?.at(-1)?.high ??
        null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY],
      ),
    },
    delegatedSupplyChart:
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY] || [],
    cexSupply: {
      value: timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY],
      ),
    },
    cexSupplyChart: timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY] || [],
    dexSupply: {
      value: timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY],
      ),
    },
    dexSupplyChart: timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY] || [],
    lendingSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY],
      ),
    },
    lendingSupplyChart: timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY] || [],
  };

  // const {
  //   delegatedSupplyChart,
  //   cexSupplyChart,
  //   dexSupplyChart,
  //   lendingSupplyChart,
  //   days,
  //   setDays,
  // } = useTokenDistributionContext();

  const datasets: Record<string, DaoMetricsDayBucket[] | undefined> = {
    delegatedSupply: value.delegatedSupplyChart,
    cexSupply: value.cexSupplyChart,
    dexSupply: value.dexSupplyChart,
    lendingSupply: value.lendingSupplyChart,
  };
  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.tokenDistribution.title}
      // subtitle="Token Supply Distribution"
      icon={<ArrowRightLeft className="section-layout-icon" />}
      // switchDate={
      //   <SwitcherDate
      //     defaultValue={TimeInterval.ONE_YEAR}
      //     setTimeInterval={setDays}
      //     isSmall
      //   />
      // }
      description={PAGES_CONSTANTS.tokenDistribution.description}
      // days={days}
    >
      <SubSectionsContainer>
        <SubSection
          subsectionTitle={PAGES_CONSTANTS.tokenDistribution.title}
          dateRange={getDateRange(days ?? "")}
          switchDate={
            <SwitcherDateMobile
              defaultValue={TimeInterval.ONE_YEAR}
              setTimeInterval={setDays}
            />
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
          <ChartLegend
            items={Object.values(chartConfig).map(({ label, color }) => ({
              label,
              color,
            }))}
          />
        </SubSection>
        {/* <TheCardChartLayout
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
        </TheCardChartLayout> */}
        <div className="border-light-dark w-full border-t" />
        <TokenDistributionTable value={value} />
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
