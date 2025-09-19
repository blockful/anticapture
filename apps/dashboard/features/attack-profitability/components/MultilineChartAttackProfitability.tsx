"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/shared/components/ui/chart";

import { DaoIdEnum } from "@/shared/types/daos";
import { useParams } from "next/navigation";

import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { MultilineChartDataSetPoint } from "@/shared/dao-config/types";
import { useDaoData, useTimeSeriesData } from "@/shared/hooks";
import { filterPriceHistoryByTimeInterval } from "@/features/attack-profitability/utils";

import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { useEffect, useState } from "react";
import { mockedAttackProfitabilityDatasets } from "@/shared/constants/mocked-data/mocked-attack-profitability-datasets";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { AttackProfitabilityCustomTooltip } from "@/features/attack-profitability/components";
import {
  useDaoTokenHistoricalData,
  useTreasuryAssetNonDaoToken,
} from "@/features/attack-profitability/hooks";
import { timestampToReadableDate } from "@/shared/utils";
import {
  normalizeDataset,
  normalizeDatasetTreasuryNonDaoToken,
  normalizeDatasetAllTreasury,
} from "@/features/attack-profitability/utils";
import daoConfigByDaoId from "@/shared/dao-config";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { DownloadIcon } from "lucide-react";
import { convertToCSV, downloadCSV } from "@/shared/utils/formatDatasetsToCSV";

type ChartSeriesKey = "treasuryNonDAO" | "all" | "quorum" | "delegated";
type AttackChartConfig = Record<
  ChartSeriesKey | string,
  { label: string; color: string }
>;

interface MultilineChartAttackProfitabilityProps {
  days: string;
  filterData?: string[];
}

export const MultilineChartAttackProfitability = ({
  filterData,
  days,
}: MultilineChartAttackProfitabilityProps) => {
  const { daoId }: { daoId: string } = useParams();
  const { data: daoData } = useDaoData(daoId.toUpperCase() as DaoIdEnum);
  const [mocked, setMocked] = useState<boolean>(false);

  const { data: treasuryAssetNonDAOToken = [] } = useTreasuryAssetNonDaoToken(
    daoId.toUpperCase() as DaoIdEnum,
    TimeInterval.ONE_YEAR,
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
    setMocked(
      timeSeriesData !== undefined &&
        Object.values(timeSeriesData).every((data) => data.length === 0),
    );
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

  const chartConfig: AttackChartConfig = {
    treasuryNonDAO: {
      label: `Non-${daoId.toUpperCase() as DaoIdEnum}`,
      color: "#4ade80",
    },
    all: { label: "All", color: "#4ade80" },
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
      )
        .reverse()
        .slice(365 - Number(days.split("d")[0])),
      all: normalizeDatasetAllTreasury(
        selectedPriceHistory,
        "all",
        treasuryAssetNonDAOToken,
        treasurySupplyChart,
      ).slice(365 - Number(days.split("d")[0])),
      quorum: daoConfigByDaoId[daoId.toUpperCase() as DaoIdEnum]
        ?.attackProfitability?.dynamicQuorum?.percentage
        ? normalizeDataset(
            selectedPriceHistory,
            "quorum",
            null,
            delegatedSupplyChart,
          )
            .slice(365 - Number(days.split("d")[0]))
            .map((datasetpoint) => ({
              ...datasetpoint,
              quorum:
                datasetpoint.quorum *
                (daoConfigByDaoId[daoId.toUpperCase() as DaoIdEnum]
                  ?.attackProfitability?.dynamicQuorum?.percentage ?? 0),
            }))
        : quorumValue
          ? normalizeDataset(selectedPriceHistory, "quorum", quorumValue).slice(
              365 - Number(days.split("d")[0]),
            )
          : [],
      delegated: delegatedSupplyChart
        ? normalizeDataset(
            selectedPriceHistory,
            "delegated",
            null,
            delegatedSupplyChart,
          ).slice(365 - Number(days.split("d")[0]))
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

  const lastKnownValues: Record<string, number | null> = {};

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

  const handleDownload = () => {
    const activeKeys = Object.keys(chartConfig).filter((key) => {
      if (!filterData?.length) return true;
      const { label } = chartConfig[key];
      return filterData.includes(key) || filterData.includes(label);
    });

    const normalizeDataset = (key: string) =>
      chartData.map((point) => ({
        date: String(point.date),
        value: point[key] == null ? "" : String(point[key]),
      }));

    const normalizedDatasets = Object.fromEntries(
      activeKeys.map((key) => [key, normalizeDataset(key)]),
    );

    const subsetChartConfig = Object.fromEntries(
      activeKeys.map((key) => [key, chartConfig[key]]),
    );

    const csv = convertToCSV(normalizedDatasets, subsetChartConfig);
    downloadCSV(csv, `attack_profitability_${daoId}.csv`);
  };

  return (
    <>
      <div className="sm:border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg">
        {mocked && <ResearchPendingChartBlur />}
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
                <AttackProfitabilityCustomTooltip chartConfig={chartConfig} />
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
        {/* Watermark */}
        <AnticaptureWatermark />
      </div>
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
    </>
  );
};
