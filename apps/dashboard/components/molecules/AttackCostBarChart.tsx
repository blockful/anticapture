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

interface ChartDataItem {
  name: string;
  value: number;
  id: string;
}

interface AttackCostBarChartProps {
  className?: string;
}

const AttackCostBarChart = ({ className }: AttackCostBarChartProps) => {
  const { daoId }: { daoId: string } = useParams();
  const selectedDaoId = daoId.toUpperCase() as DaoIdEnum;
  const timeInterval = TimeInterval.NINETY_DAYS;

  // Hooks
  const liquidTreasury = useTreasuryAssetNonDaoToken(
    selectedDaoId,
    timeInterval,
  );
  const delegatedSupply = useDelegatedSupply(selectedDaoId, timeInterval);
  const activeSupply = useActiveSupply(selectedDaoId, timeInterval);
  const averageTurnout = useAverageTurnout(selectedDaoId, timeInterval);
  const {
    data: daoTokenPriceHistoricalData,
    loading: daoTokenPriceHistoricalDataLoading,
  } = useDaoTokenHistoricalData(selectedDaoId);

  // Extract price calculation
  const lastPrice = React.useMemo(() => {
    const prices = daoTokenPriceHistoricalData.prices;
    return prices.length > 0 ? prices[prices.length - 1][1] : 0;
  }, [daoTokenPriceHistoricalData]);

  // Check for loading state
  const isLoading =
    liquidTreasury.loading ||
    delegatedSupply.isLoading ||
    activeSupply.isLoading ||
    averageTurnout.isLoading ||
    daoTokenPriceHistoricalDataLoading;

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className={`h-80 w-full ${className || ""}`}>
        <SkeletonRow width="w-full" height="h-80" />
      </div>
    );
  }

  // Prepare chart data
  const chartData: ChartDataItem[] = [
    {
      id: "liquidTreasury",
      name: "Liquid Treasury",
      value: Number(liquidTreasury.data?.[0]?.totalAssets || 0),
    },
    {
      id: "delegatedSupply",
      name: "Delegated Supply",
      value:
        Number(
          formatEther(
            BigInt(delegatedSupply.data?.currentDelegatedSupply || "0"),
          ),
        ) * lastPrice,
    },
    {
      id: "activeSupply",
      name: "Active Supply",
      value:
        Number(formatEther(BigInt(activeSupply.data?.activeSupply || "0"))) *
        lastPrice,
    },
    {
      id: "averageTurnout",
      name: "Average Turnout",
      value:
        Number(
          formatEther(
            BigInt(averageTurnout.data?.currentAverageTurnout || "0"),
          ),
        ) * lastPrice,
    },
  ];

  return (
    <div className={`h-80 w-full ${className || ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
          }}
        >
          <XAxis
            dataKey="name"
            height={60}
            tick={(props) => <CustomXAxisTick {...props} />}
            interval={0}
          />
          <YAxis tick={(props) => <CustomYAxisTick {...props} />} />
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!(active && payload && payload.length)) return null;

  return (
    <div className="rounded border border-gray-200 bg-white p-2 shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-blue-600">{`Cost: $${payload[0].value.toLocaleString()}`}</p>
    </div>
  );
};

interface AxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string | number;
  };
}

const CustomYAxisTick = (props: AxisTickProps) => {
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
        {formatCurrencyValue(Number(payload.value))}
      </text>
    </g>
  );
};

const CustomXAxisTick = ({ x, y, payload }: AxisTickProps) => {
  const MAX_CHARS_PER_LINE = 10;
  const words = String(payload.value).split(" ");
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

export default AttackCostBarChart;
