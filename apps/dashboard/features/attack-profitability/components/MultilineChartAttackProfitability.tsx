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
import {
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import { useDaoData, useTimeSeriesData } from "@/shared/hooks";
import { filterPriceHistoryByTimeInterval } from "@/features/attack-profitability/utils";

import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { useEffect, useMemo, useRef } from "react";
import { mockedAttackProfitabilityDatasets } from "@/shared/constants/mocked-data/mocked-attack-profitability-datasets";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { AttackProfitabilityCustomTooltip } from "@/features/attack-profitability/components";
import {
  useDaoTokenHistoricalData,
  useTreasuryAssetNonDaoToken,
} from "@/features/attack-profitability/hooks";
import {
  cn,
  formatNumberUserReadable,
  timestampToReadableDate,
} from "@/shared/utils";
import {
  normalizeDataset,
  normalizeDatasetTreasuryNonDaoToken,
  normalizeDatasetAllTreasury,
} from "@/features/attack-profitability/utils";
import daoConfigByDaoId from "@/shared/dao-config";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { Data } from "react-csv/lib/core";

interface MultilineChartAttackProfitabilityProps {
  days: string;
  filterData?: string[];
  setCsvData?: (data: Data) => void;
  context?: "overview" | "section";
}

export const MultilineChartAttackProfitability = ({
  filterData,
  days,
  setCsvData,
  context = "section",
}: MultilineChartAttackProfitabilityProps) => {
  const { daoId }: { daoId: string } = useParams();
  const { data: daoData } = useDaoData(daoId.toUpperCase() as DaoIdEnum);

  const { data: treasuryAssetNonDAOToken = [] } = useTreasuryAssetNonDaoToken(
    daoId.toUpperCase() as DaoIdEnum,
    TimeInterval.ONE_YEAR,
  );

  const { data: daoTokenPriceHistoricalData = { prices: [] } } =
    useDaoTokenHistoricalData({ daoId: daoId.toUpperCase() as DaoIdEnum });

  const { data: timeSeriesData } = useTimeSeriesData(
    daoId.toUpperCase() as DaoIdEnum,
    [MetricTypesEnum.TREASURY, MetricTypesEnum.DELEGATED_SUPPLY],
    days as TimeInterval,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  const mocked = useMemo(
    () =>
      timeSeriesData !== undefined &&
      Object.values(timeSeriesData).every((d) => d.length === 0),
    [timeSeriesData],
  );

  const quorumValue = daoData?.quorum
    ? Number(daoData.quorum) / 10 ** 18
    : null;

  const chartConfig = useMemo(
    () => ({
      treasuryNonDAO: {
        label: `Non-${daoId.toUpperCase() as DaoIdEnum}`,
        color: "#4ade80",
      },
      all: { label: "All", color: "#4ade80" },
      quorum: { label: "Quorum", color: "#f87171" },
      delegated: { label: "Delegated", color: "#f87171" },
    }),
    [daoId],
  ) satisfies ChartConfig;

  const selectedPriceHistory = useMemo(() => {
    const priceHistoryByTimeInterval = filterPriceHistoryByTimeInterval(
      daoTokenPriceHistoricalData.prices,
    );
    return (
      priceHistoryByTimeInterval[days as TimeInterval] ??
      priceHistoryByTimeInterval.full ??
      priceHistoryByTimeInterval
    );
  }, [daoTokenPriceHistoricalData.prices, days]);

  const chartData = useMemo(() => {
    let delegatedSupplyChart: DaoMetricsDayBucket[] = [];
    let treasurySupplyChart: DaoMetricsDayBucket[] = [];
    if (timeSeriesData) {
      treasurySupplyChart = timeSeriesData[MetricTypesEnum.TREASURY];
      delegatedSupplyChart = timeSeriesData[MetricTypesEnum.DELEGATED_SUPPLY];
    }

    let datasets: Record<string, MultilineChartDataSetPoint[]> = {};
    if (mocked) {
      datasets = mockedAttackProfitabilityDatasets;
    }

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

    const lastKnownValues: Record<string, number | null> = {};

    const allDates = new Set(
      Object.values(datasets).flatMap((dataset) =>
        dataset.map((item) => item.date),
      ),
    );

    const data = Array.from(allDates)
      .sort((a, b) => a - b)
      .map((date) => {
        const dataPoint: Record<string, number | null> = { date };

        Object.entries(datasets).forEach(([key, dataset]) => {
          const chartLabel =
            chartConfig[key as keyof typeof chartConfig]?.label;
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

    return data;
  }, [
    filterData,
    chartConfig,
    days,
    daoId,
    mocked,
    quorumValue,
    selectedPriceHistory,
    treasuryAssetNonDAOToken,
    timeSeriesData,
  ]);

  const prevCsvRef = useRef<string>("");

  useEffect(() => {
    if (mocked || !chartData.length) return;
    const serialized = JSON.stringify(chartData);
    if (serialized !== prevCsvRef.current) {
      prevCsvRef.current = serialized;
      setCsvData?.(chartData as Data);
    }
  }, [chartData, mocked, setCsvData]);

  return (
    <div
      className={cn(
        "sm:border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg",
        {
          "-mb-1 h-32": context === "overview",
        },
      )}
    >
      {mocked && <ResearchPendingChartBlur />}
      <ChartContainer
        className="h-full w-full justify-start"
        config={chartConfig}
      >
        <LineChart
          data={chartData}
          margin={{ top: 0, right: 16, left: -16, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="date"
            scale="time"
            type="number"
            domain={["auto", "auto"]}
            tickMargin={8}
            tickFormatter={(timestamp) =>
              timestampToReadableDate(timestamp, "abbreviated")
            }
            allowDuplicatedCategory={false}
            padding={{ left: 0, right: 20 }}
          />
          <YAxis
            tickFormatter={(value) => formatNumberUserReadable(value)}
            yAxisId={0}
            domain={["auto", "auto"]}
          />
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
  );
};
