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
import { ExtractableValueCustomTooltip } from "../01-atoms/ExtractableValueCustomTooltip";
import {
  TreasuryAssetNonDaoToken,
  fetchDaoTokenHistoricalData,
  fetchTreasuryAssetNonDaoToken,
} from "@/lib/server/backend";
import { DaoIdEnum } from "@/lib/types/daos";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMultilineChartDatasets, PriceDataArray } from "@/lib/mocked-data";
import { useGovernanceActivityContext } from "../contexts/GovernanceActivityContext";
import { useDaoDataContext, useTokenDistributionContext } from "../contexts";

interface MultilineChartExtractableValueProps {
  days: string;
  filterData?: string[];
}

type DatasetType = TreasuryAssetNonDaoToken[] | PriceDataArray;

export const MultilineChartExtractableValue = ({
  filterData,
  days,
}: MultilineChartExtractableValueProps) => {
  const { daoId }: { daoId: string } = useParams();
  const [treasuryAssetNonDAOToken, setTreasuryAssetNonDAOToken] = useState<
    TreasuryAssetNonDaoToken[]
  >([]);

  const { treasurySupplyChart } = useGovernanceActivityContext();
  const { delegatedSupplyChart } = useTokenDistributionContext();
  const { daoData } = useDaoDataContext();

  const quorumValue = daoData?.quorum
    ? Number(daoData.quorum) / 10 ** 18
    : null;

  useEffect(() => {
    fetchTreasuryAssetNonDaoToken({
      daoId: daoId.toUpperCase() as DaoIdEnum,
      days: days,
    }).then((data: TreasuryAssetNonDaoToken[]) => {
      setTreasuryAssetNonDAOToken(data);
    });

    fetchDaoTokenHistoricalData({
      daoId: daoId.toUpperCase() as DaoIdEnum,
    }).then((data) => {
      console.log("data fetchDaoTokenHistoricalData = ", data);
    });
  }, [days, daoId]);

  const chartConfig = {
    treasuryNonDAO: {
      label: `Non-${daoId.toUpperCase() as DaoIdEnum}`,
      color: "#22c55e",
    },
    all: { label: "All", color: "#22c55e" },
    quorum: { label: "Quorum", color: "#f87171" },
    delegated: { label: "Delegated", color: "#f87171" },
  } satisfies ChartConfig;

  const multilineChartDatasets = getMultilineChartDatasets();
  const selectedMultilineChart =
    multilineChartDatasets[days as keyof typeof multilineChartDatasets] ??
    multilineChartDatasets.full ??
    [];

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

  const datasets: Record<string, any[]> = {
    treasuryNonDAO: normalizeDataset(
      treasuryAssetNonDAOToken,
      "treasuryNonDAO",
    ),
    all: normalizeDataset(selectedMultilineChart, "all"),
    quorum: quorumValue
      ? normalizeDataset(selectedMultilineChart, "quorum", quorumValue)
      : [],
    delegated: delegatedSupplyChart
      ? normalizeDataset(selectedMultilineChart, "delegated")
      : [],
  };

  datasets.delegated = selectedMultilineChart.map((item) => {
    const normalizedDate = new Date(item[0]).getTime();

    const delegatedEntry = (delegatedSupplyChart || []).find(
      (delegated) => Number(delegated.date) * 1000 === normalizedDate,
    );

    return {
      date: normalizedDate,
      delegated: delegatedEntry ? Number(delegatedEntry.high) : null,
    };
  });

  datasets.all = datasets.all.map((item) => {
    const treasuryEntry = treasurySupplyChart.find(
      (treasury) => new Date(treasury.date).getTime() === item.date,
    );

    return treasuryEntry
      ? {
          ...item,
          all: Number(treasuryEntry.high) * item.all,
        }
      : item;
  });

  const allDates = new Set(
    Object.values(datasets).flatMap((dataset) =>
      dataset.map((item) => item.date),
    ),
  );

  let lastKnownValues: Record<string, number | null> = {};

  const chartData = Array.from(allDates)
    .sort((a, b) => a - b)
    .map((date) => {
      const dataPoint: Record<string, any> = { date };

      Object.entries(datasets).forEach(([key, dataset]) => {
        if (
          filterData?.includes(key) ||
          filterData?.includes(
            chartConfig[key as keyof typeof chartConfig]?.label,
          )
        ) {
          return;
        }

        const value = dataset.find((d) => d.date === date)?.[key] ?? null;
        if (value !== null) lastKnownValues[key] = value;
        dataPoint[key] = lastKnownValues[key] ?? null;
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
