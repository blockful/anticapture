"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ExtractableValueCustomTooltip } from "@/components/atoms";

import { DaoIdEnum } from "@/lib/types/daos";
import { useParams } from "next/navigation";
import { filterPriceHistoryByTimeInterval } from "@/lib/mocked-data";

import { TimeInterval } from "@/lib/enums/TimeInterval";
import { PriceEntry } from "@/lib/dao-constants/types";
import { useTokenDistributionContext, useDaoDataContext } from "@/contexts";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";
import { useDaoTokenHistoricalData } from "@/hooks/useDaoTokenHistoricalData";
import {
  TreasuryAssetNonDaoToken,
  useTreasuryAssetNonDaoToken,
} from "@/hooks/useTreasuryAssetNonDaoToken";

interface MultilineChartExtractableValueProps {
  days: string;
  filterData?: string[];
}

type DatasetType = TreasuryAssetNonDaoToken[] | PriceEntry[];

interface ChartDataPoint {
  date: number;
  [key: string]: number;
}

export const MultilineChartExtractableValue = ({
  filterData,
  days,
}: MultilineChartExtractableValueProps) => {
  const { daoId }: { daoId: string } = useParams();
  const { data: treasuryAssetNonDAOToken = [] } = useTreasuryAssetNonDaoToken(
    daoId.toUpperCase() as DaoIdEnum,
    days,
  );
  const { data: daoTokenPriceHistoricalData = { prices: [] } } =
    useDaoTokenHistoricalData(daoId.toUpperCase() as DaoIdEnum);

  const { treasurySupplyChart } = useGovernanceActivityContext();
  const { delegatedSupplyChart } = useTokenDistributionContext();
  const { daoData } = useDaoDataContext();

  const quorumValue = daoData?.quorum
    ? Number(daoData.quorum) / 10 ** 18
    : null;

  const chartConfig = {
    treasuryNonDAO: {
      label: `Non-${daoId.toUpperCase() as DaoIdEnum}`,
      color: "#22c55e",
    },
    all: { label: "All", color: "#22c55e" },
    quorum: { label: "Quorum", color: "#f87171" },
    delegated: { label: "Delegated", color: "#f87171" },
  } satisfies ChartConfig;

  const priceHistoryByTimeInterval = filterPriceHistoryByTimeInterval(
    daoTokenPriceHistoricalData.prices,
  );

  const selectedPriceHistory =
    priceHistoryByTimeInterval[days as TimeInterval] ??
    priceHistoryByTimeInterval.full ??
    priceHistoryByTimeInterval;

  const normalizeDataset = (
    dataset: DatasetType,
    key: string,
    multiplier: number | null = null,
  ) => {
    return dataset.map((item) => {
      if (Array.isArray(item)) {
        return {
          date: item[0],
          [key]: multiplier ? item[1] * multiplier : item[1],
        };
      } else {
        return {
          date: new Date(item.date).getTime(),
          [key]: multiplier
            ? Number(item.totalAssets) * multiplier
            : Number(item.totalAssets),
        };
      }
    });
  };

  const normalizeDatasetTreasuryNonDaoToken = (
    dataset: TreasuryAssetNonDaoToken[],
    key: string,
  ): ChartDataPoint[] => {
    return dataset.map((item) => {
      return {
        date: new Date(item.date).getTime(),
        [key]: Number(item.totalAssets),
      };
    });
  };

  const datasets: Record<string, ChartDataPoint[]> = {
    treasuryNonDAO: normalizeDatasetTreasuryNonDaoToken(
      treasuryAssetNonDAOToken,
      "treasuryNonDAO",
    ),
    all: normalizeDataset(selectedPriceHistory, "all"),
    quorum: quorumValue
      ? normalizeDataset(selectedPriceHistory, "quorum", quorumValue)
      : [],
    delegated: delegatedSupplyChart
      ? normalizeDataset(selectedPriceHistory, "delegated")
      : [],
  };

  const allDates = new Set(
    Object.values(datasets).flatMap((dataset) =>
      dataset.map((item) => item.date),
    ),
  );

  let lastKnownValues: Record<string, number | null> = {};

  const chartData = Array.from(allDates)
    .sort((a, b) => a - b)
    .map((date) => {
      const dataPoint: Record<string, number | null> = { date };

      Object.entries(datasets).forEach(([key, dataset]) => {
        const chartLabel = chartConfig[key as keyof typeof chartConfig]?.label;
        const isKeySelected = filterData?.includes(key);
        const isLabelSelected = filterData?.includes(chartLabel);

        if (isKeySelected || isLabelSelected) {
          const value = dataset.find((d) => d.date === date)?.[key] ?? null;
          if (value !== null) lastKnownValues[key] = value;
          dataPoint[key] = lastKnownValues[key] ?? null;
        }
      });

      return dataPoint;
    });

  return (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-lightDark bg-dark p-4 text-white">
      <ChartContainer className="h-full w-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} stroke="#27272a" />
            <XAxis
              dataKey="date"
              scale="time"
              type="number"
              domain={["auto", "auto"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })
              }
            />
            <YAxis hide={true} />
            <Tooltip
              content={
                <ExtractableValueCustomTooltip chartConfig={chartConfig} />
              }
            />
            {Object.entries(chartConfig)
              .filter(
                ([key], index: number) =>
                  !filterData || key !== filterData[index],
              )
              .map(([key, config]) => (
                <Line
                  key={key}
                  dataKey={key}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
