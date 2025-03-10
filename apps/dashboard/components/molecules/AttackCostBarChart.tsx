"use client";

import { useActiveSupply } from "@/hooks/useActiveSupply";
import { useAverageTurnout } from "@/hooks/useAverageTurnout";
import { useDelegatedSupply } from "@/hooks/useDelegatedSupply";
import { useTreasuryAssetNonDaoToken } from "@/hooks/useTreasuryAssetNonDaoToken";
import { formatCurrencyValue } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SkeletonRow } from "../atoms";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useDaoTokenHistoricalData } from "@/hooks/useDaoTokenHistoricalData";
import { formatEther } from "viem";
import { useParams } from "next/navigation";

// Sample data - replace with your actual data
const data = [
  {
    name: "Liquid Treasury",
    value: 0,
  },
  {
    name: "Delegated Supply",
    value: 0,
  },
  {
    name: "Active Supply",
    value: 0,
  },
  {
    name: "Average Turnout",
    value: 0,
  },
];

interface AttackCostBarChartProps {
  className?: string;
}

const AttackCostBarChart = ({ className }: AttackCostBarChartProps) => {
  const { daoId }: { daoId: string } = useParams();

  const selectedDaoId = daoId.toUpperCase() as DaoIdEnum;

  const liquidTreasury = useTreasuryAssetNonDaoToken(
    selectedDaoId,
    TimeInterval.NINETY_DAYS,
  );
  const delegatedSupply = useDelegatedSupply(
    selectedDaoId,
    TimeInterval.NINETY_DAYS,
  );
  const activeSupply = useActiveSupply(selectedDaoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(
    selectedDaoId,
    TimeInterval.NINETY_DAYS,
  );

  const {
    data: daoTokenPriceHistoricalData,
    loading: daoTokenPriceHistoricalDataLoading,
  } = useDaoTokenHistoricalData(selectedDaoId);

  const lastPrice =
    daoTokenPriceHistoricalData.prices.length > 0
      ? daoTokenPriceHistoricalData.prices[
          daoTokenPriceHistoricalData.prices.length - 1
        ][1]
      : 0;

  if (
    liquidTreasury.loading ||
    delegatedSupply.isLoading ||
    activeSupply.isLoading ||
    averageTurnout.isLoading ||
    daoTokenPriceHistoricalDataLoading
  ) {
    return (
      <div className={`h-80 w-full ${className || ""}`}>
        <SkeletonRow width="w-full" height="h-80" />
      </div>
    );
  }

  data[0].value = Number(liquidTreasury.data?.[0]?.totalAssets || 0); // Already in USD
  data[1].value =
    Number(
      formatEther(BigInt(delegatedSupply.data?.currentDelegatedSupply || "0")),
    ) * lastPrice;
  data[2].value =
    Number(formatEther(BigInt(activeSupply.data?.activeSupply || "0"))) *
    lastPrice;
  data[3].value =
    Number(
      formatEther(BigInt(averageTurnout.data?.currentAverageTurnout || "0")),
    ) * lastPrice;

  return (
    <div className={`h-80 w-full ${className || ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
          }}
        >
          <XAxis
            dataKey="name"
            height={60}
            tick={<CustomXAxisTick />}
            interval={0}
          />
          <YAxis tick={<CustomYAxisTick />} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="value"
            fill="#22c55e"
            name="Attack Cost"
            radius={[8, 8, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttackCostBarChart;

// Custom tooltip component to avoid inheritance issues
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-gray-200 bg-white p-2 shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-blue-600">{`Cost: $${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

// Custom Y-axis label component
const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-10}
        textAnchor="end"
        fill="#777"
        fontSize={10}
        className="font-medium"
      >
        {formatCurrencyValue(payload.value)}
      </text>
    </g>
  );
};

// Custom X-axis label component
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;

  // Split the text at whitespace and create lines with max length
  const MAX_CHARS_PER_LINE = 10;
  const words = payload.value.split(" ");
  const lines = [];
  let currentLine = "";

  // Group words into lines without exceeding max length
  words.forEach((word: string) => {
    if (currentLine.length + word.length <= MAX_CHARS_PER_LINE) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  // Add the last line if it's not empty
  if (currentLine) {
    lines.push(currentLine);
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={0}
          dy={16 + index * 12} // Increase dy for each line
          textAnchor="middle"
          fill="gray"
          fontSize={10}
          className="font-medium"
        >
          {line}
        </text>
      ))}
    </g>
  );
};
