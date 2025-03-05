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
  fetchTreasuryAssetNonDaoToken,
} from "@/lib/server/backend";
import { DaoIdEnum } from "@/lib/types/daos";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMultilineChartDatasets, PriceDataArray } from "@/lib/mocked-data";
import { useGovernanceActivityContext } from "../contexts/GovernanceActivityContext";

interface ChartProps {
  days: string;
  filterData?: string[];
}

type DatasetType = TreasuryAssetNonDaoToken[] | PriceDataArray;

export const MultilineChartExtractableValue = ({
  filterData,
  days,
}: ChartProps) => {
  const { daoId }: { daoId: string } = useParams();
  const [treasuryAssetNonDAOToken, setTreasuryAssetNonDAOToken] = useState<
    TreasuryAssetNonDaoToken[]
  >([]);

  const { treasurySupplyChart } = useGovernanceActivityContext();

  useEffect(() => {
    fetchTreasuryAssetNonDaoToken({
      daoId: daoId.toUpperCase() as DaoIdEnum,
      days: days,
    }).then((data: TreasuryAssetNonDaoToken[]) => {
      setTreasuryAssetNonDAOToken(data);
    });
  }, [days]);

  const chartConfig = {
    treasuryNonDAO: {
      label: `Non-${daoId.toUpperCase() as DaoIdEnum}`,
      color: "hsl(var(--chart-1))",
    },
    all: { label: "All", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  const normalizeDataset = (dataset: DatasetType, key: string) => {
    return dataset.map((item) => {
      if (Array.isArray(item)) {
        return { date: item[0], [key]: item[1] };
      } else {
        return {
          date: new Date(item.date).getTime(),
          [key]: Number(item.totalAssets),
        };
      }
    });
  };

  const multilineChartDatasets = getMultilineChartDatasets();

  const selectedMultilineChart =
    multilineChartDatasets[days as keyof typeof multilineChartDatasets] ??
    multilineChartDatasets.full ??
    [];

  const datasets: Record<keyof typeof chartConfig, any[]> = {
    treasuryNonDAO: normalizeDataset(
      treasuryAssetNonDAOToken,
      "treasuryNonDAO",
    ),
    all: normalizeDataset(selectedMultilineChart, "all"),
  };

  datasets.all = datasets.all.map((item) => {
    const treasuryEntry = treasurySupplyChart.find(
      (treasury) => new Date(treasury.date).getTime() === item.date,
    );

    if (treasuryEntry) {
      return {
        ...item,
        all: Number(treasuryEntry.high) * item.all,
      };
    }

    return item;
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
        console.log("🔍 Checando filtro:", {
          key,
          filterData,
          label: chartConfig[key as keyof typeof chartConfig]?.label,
        });

        if (
          filterData?.includes(key) ||
          filterData?.includes(
            chartConfig[key as keyof typeof chartConfig]?.label,
          )
        ) {
          console.log(`🚫 Removendo ${key} do gráfico`);
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
