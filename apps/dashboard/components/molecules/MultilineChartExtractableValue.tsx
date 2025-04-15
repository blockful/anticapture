"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import { MultilineChartDataSetPoint } from "@/lib/dao-config/types";
import { useDaoDataContext } from "@/contexts";
import {
  useDaoTokenHistoricalData,
  useTimeSeriesData,
  useTreasuryAssetNonDaoToken,
} from "@/hooks";
import {
  normalizeDatasetTreasuryNonDaoToken,
  normalizeDatasetAllTreasury,
  normalizeDataset,
  timestampToReadableDate,
} from "@/lib/client/utils";
import { MetricTypesEnum } from "@/lib/client/constants";
import { useState } from "react";

interface MultilineChartExtractableValueProps {
  days: string;
  filterData?: string[];
}

export const MultilineChartExtractableValue = ({
  filterData,
  days,
}: MultilineChartExtractableValueProps) => {
  const { daoData } = useDaoDataContext();
  const { daoId }: { daoId: string } = useParams();
  const [mocked, setMocked] = useState(false);
  const { data: treasuryAssetNonDAOToken = [] } = useTreasuryAssetNonDaoToken(
    daoId.toUpperCase() as DaoIdEnum,
    days,
  );
  const { data: daoTokenPriceHistoricalData = { prices: [] } } =
    useDaoTokenHistoricalData(daoId.toUpperCase() as DaoIdEnum);

  const { data: treasuryData } = useTimeSeriesData(
    daoId.toUpperCase() as DaoIdEnum,
    [MetricTypesEnum.TREASURY],
    parseInt(days.split("d")[0]),
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  const { data: delegatedData } = useTimeSeriesData(
    daoId.toUpperCase() as DaoIdEnum,
    [MetricTypesEnum.DELEGATED_SUPPLY],
    parseInt(days.split("d")[0]),
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  let delegatedSupplyChart;
  let treasurySupplyChart;
  if (treasuryData) {
    treasurySupplyChart = treasuryData[MetricTypesEnum.TREASURY];
  }
  if (delegatedData) {
    delegatedSupplyChart = delegatedData[MetricTypesEnum.DELEGATED_SUPPLY];
  }

  console.log(treasuryData);
  console.log(delegatedData);

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

  const datasets: Record<string, MultilineChartDataSetPoint[]> = {
    treasuryNonDAO: normalizeDatasetTreasuryNonDaoToken(
      treasuryAssetNonDAOToken,
      "treasuryNonDAO",
    ),
    all: normalizeDatasetAllTreasury(
      selectedPriceHistory,
      "all",
      treasuryAssetNonDAOToken,
      treasurySupplyChart,
    ),
    quorum: quorumValue
      ? normalizeDataset(selectedPriceHistory, "quorum", quorumValue)
      : [],
    delegated: delegatedSupplyChart
      ? normalizeDataset(
          selectedPriceHistory,
          "delegated",
          null,
          delegatedSupplyChart,
        )
      : [],
  };
  if(datasets)

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
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg text-white sm:border-lightDark sm:bg-dark">
      <ChartContainer className="h-full w-full" config={chartConfig}>
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
            tickFormatter={(date) => timestampToReadableDate(date)}
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
      </ChartContainer>
    </div>
  );
};
