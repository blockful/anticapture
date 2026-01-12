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

import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { useEffect, useMemo, useRef } from "react";
import { mockedAttackProfitabilityDatasets } from "@/shared/constants/mocked-data/mocked-attack-profitability-datasets";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { AttackProfitabilityCustomTooltip } from "@/features/attack-profitability/components";
import {
  useDaoTokenHistoricalData,
  useTreasury,
} from "@/features/attack-profitability/hooks";
import {
  cn,
  formatNumberUserReadable,
  timestampToReadableDate,
} from "@/shared/utils";
import { normalizeDataset } from "@/features/attack-profitability/utils";
import daoConfigByDaoId from "@/shared/dao-config";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { Data } from "react-csv/lib/core";
import { formatUnits } from "viem";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/loading-animation.json";

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
  const { daoId } = useParams<{ daoId: string }>();
  const daoEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data: daoData } = useDaoData(daoEnum);
  const daoConfig = daoConfigByDaoId[daoEnum];

  const { data: liquidTreasuryData } = useTreasury(
    daoEnum,
    "liquid",
    days as TimeInterval,
  );
  const { data: totalTreasuryData } = useTreasury(
    daoEnum,
    "total",
    days as TimeInterval,
  );

  const {
    data: daoTokenPriceHistoricalData,
    loading: isLoadingDaoTokenPriceHistoricalData,
  } = useDaoTokenHistoricalData({
    daoId: daoEnum,
    limit: Number(days.split("d")[0]),
  });

  const { data: timeSeriesData, isLoading: isLoadingTimeSeriesData } =
    useTimeSeriesData(
      daoEnum,
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

  const quorumValue = Number(
    formatUnits(BigInt(daoData?.quorum || "0"), daoConfig.decimals),
  );

  const chartConfig = useMemo(
    () => ({
      treasuryNonDAO: {
        label: `Non-${daoEnum}`,
        color: "#4ade80",
      },
      all: { label: "All", color: "#4ade80" },
      quorum: { label: "Quorum", color: "#f87171" },
      delegated: { label: "Delegated", color: "#f87171" },
    }),
    [daoEnum],
  ) satisfies ChartConfig;

  const chartData = useMemo(() => {
    let delegatedSupplyChart: DaoMetricsDayBucket[] = [];
    if (timeSeriesData) {
      delegatedSupplyChart = timeSeriesData[MetricTypesEnum.DELEGATED_SUPPLY];
    }

    let datasets: Record<string, MultilineChartDataSetPoint[]> = {};
    if (mocked) {
      datasets = mockedAttackProfitabilityDatasets;
    } else {
      datasets = {
        treasuryNonDAO: liquidTreasuryData.map((item) => ({
          date: item.date,
          treasuryNonDAO: item.value,
        })),
        all: totalTreasuryData.map((item) => ({
          date: item.date,
          all: item.value,
        })),
        quorum: daoConfig?.attackProfitability?.dynamicQuorum?.percentage
          ? normalizeDataset(
              daoTokenPriceHistoricalData,
              "quorum",
              delegatedSupplyChart,
              daoConfig.decimals,
            ).map((datasetpoint) => ({
              ...datasetpoint,
              quorum:
                datasetpoint.quorum !== null
                  ? datasetpoint.quorum *
                    (daoConfig?.attackProfitability?.dynamicQuorum
                      ?.percentage ?? 0)
                  : null,
            }))
          : quorumValue
            ? normalizeDataset(
                daoTokenPriceHistoricalData,
                "quorum",
                quorumValue,
                daoConfig.decimals,
              )
            : [],
        delegated: delegatedSupplyChart
          ? normalizeDataset(
              daoTokenPriceHistoricalData,
              "delegated",
              delegatedSupplyChart,
              daoConfig.decimals,
            )
          : [],
      };
    }

    const lastKnownValues: Record<string, number | null> = {};

    const allDates = new Set(
      Object.values(datasets).flatMap((dataset) =>
        dataset.map((item) => item.date),
      ),
    );

    const data = Array.from(allDates).map((date) => {
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

    return data;
  }, [
    filterData,
    chartConfig,
    mocked,
    quorumValue,
    daoTokenPriceHistoricalData,
    liquidTreasuryData,
    totalTreasuryData,
    timeSeriesData,
    daoConfig?.attackProfitability?.dynamicQuorum?.percentage,
    daoConfig.decimals,
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

  const isLoading =
    isLoadingDaoTokenPriceHistoricalData || isLoadingTimeSeriesData;

  if (isLoading) {
    return (
      <div
        className={cn("flex w-full items-center justify-center", {
          "h-[170px]": context === "overview",
          "h-[300px]": context === "section",
        })}
      >
        <Lottie animationData={loadingAnimation} height={40} width={40} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "sm:border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full items-center justify-center rounded-lg",
        {
          "-mb-1 h-44": context === "overview",
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
