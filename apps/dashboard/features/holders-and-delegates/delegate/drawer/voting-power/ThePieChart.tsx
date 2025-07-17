"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { formatNumberUserReadable } from "@/shared/utils";
import { renderCustomizedLabel } from "@/features/holders-and-delegates/delegate/drawer/voting-power/utils/renderCustomizedLabel";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

const PieChartCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<
      string,
      { label: string; color: string; ensName?: string }
    >;
    currentVotingPower: number;
  }
> = ({ active, payload, chartConfig, currentVotingPower }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const value = data.value !== undefined ? data.value : 0;
  const name = data.name || "";
  const percentage = ((value / currentVotingPower) * 100).toFixed(2);

  const config = chartConfig[name];
  const label = config?.label || name;

  return (
    <div className="bg-surface-contrast text-primary border-border-contrast rounded-md border p-2 shadow-lg">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs">
          Voting Power: <strong>{formatNumberUserReadable(value)}</strong>
        </p>
        <p className="text-xs">
          Percentage: <strong>{percentage}%</strong>
        </p>
      </div>
    </div>
  );
};

export const ThePieChart = ({
  currentVotingPower,
  pieData,
  chartConfig,
}: {
  currentVotingPower: number;
  pieData: { name: string; value: number }[];
  chartConfig: Record<
    string,
    { label: string; color: string; ensName?: string }
  >;
}) => {
  if (!pieData || pieData.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-full">
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className="size-[200px] rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            dataKey="value"
            blendStroke={true}
            stroke="none"
          >
            {pieData.map((entry, index) => {
              const color = chartConfig[entry.name]?.color || "#9CA3AF";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip
            content={
              <PieChartCustomTooltip
                chartConfig={chartConfig}
                currentVotingPower={currentVotingPower}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
};
