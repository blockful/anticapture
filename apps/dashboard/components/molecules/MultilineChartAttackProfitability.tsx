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
  filterPriceHistoryByTimeInterval,
} from "@/lib/client/utils";
import { MetricTypesEnum } from "@/lib/client/constants";
import { useEffect, useState } from "react";
import { mockedAttackProfitabilityDatasets } from "@/lib/mocked-data/mocked-attack-profitability-datasets";
import { ClockwiseIcon } from "@/components/atoms/icons/ClockwiseIcon";
import { every } from "lodash";

interface MultilineChartExtractableValueProps {
  days: string;
  filterData?: string[];
}

export const MultilineChartAttackProfitability = ({
  filterData,
  days,
}: MultilineChartExtractableValueProps) => {
  const { daoData } = useDaoDataContext();
  const { daoId }: { daoId: string } = useParams();
  const [mocked, setMocked] = useState<boolean>(false);

  const selectedDays = parseInt(days.split("d")[0]);

  const { data: treasuryAssetNonDAOToken = [] } = useTreasuryAssetNonDaoToken(
    daoId.toUpperCase() as DaoIdEnum,
    days,
  );

  const { data: daoTokenPriceHistoricalData = { prices: [] } } =
    useDaoTokenHistoricalData(daoId.toUpperCase() as DaoIdEnum);

  const { data: timeSeriesData } = useTimeSeriesData(
    daoId.toUpperCase() as DaoIdEnum,
    [MetricTypesEnum.TREASURY, MetricTypesEnum.DELEGATED_SUPPLY],
    days as TimeInterval,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );
  useEffect(() => {
    if (
      timeSeriesData !== undefined &&
      Object.values(timeSeriesData).every((data) => data.length === 0)
    ) {
      setMocked(true);
    } else {
      setMocked(false);
    }
  }, [timeSeriesData]);

  let delegatedSupplyChart;
  let treasurySupplyChart;
  if (timeSeriesData) {
    treasurySupplyChart = timeSeriesData[MetricTypesEnum.TREASURY];
    delegatedSupplyChart = timeSeriesData[MetricTypesEnum.DELEGATED_SUPPLY];
  }

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
  let datasets: Record<string, MultilineChartDataSetPoint[]> = {};
  if (!mocked) {
    datasets = {
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
  } else {
    datasets = mockedAttackProfitabilityDatasets;
  }

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
    <div className="relative flex h-[300px] w-full items-center justify-center rounded-lg text-white sm:border-lightDark sm:bg-dark">
      {mocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-lightDark bg-black/5 backdrop-blur-[6px]">
          <div className="flex items-center gap-2 rounded-full bg-[#1c1c1c] px-4 py-2 text-sm text-foreground">
            <ClockwiseIcon className="h-5 w-5 text-foreground" />
            RESEARCH PENDING
          </div>
        </div>
      )}
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
