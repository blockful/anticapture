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
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";

const PieChartCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<
      string,
      { label: string; color: string; ensName?: string }
    >;
    currentValue: number;
  }
> = ({ active, payload, chartConfig, currentValue }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const value = data.value !== undefined ? data.value : 0;
  const name = data.name || "";
  const percentage = ((value / currentValue) * 100).toFixed(2);

  const config = chartConfig[name];
  const label = config?.label || name;

  return (
    <div className="bg-surface-contrast text-primary border-border-contrast rounded-md border p-2 shadow-lg">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs">
          {formatNumberUserReadable(value)} transactions ({percentage}%)
        </p>
      </div>
    </div>
  );
};

export const ThePieChart = ({
  currentValue,
  pieData,
  chartConfig,
}: {
  currentValue: number;
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
    <div className="relative h-[200px] w-[200px]">
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
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                  className="transition-all duration-200 hover:opacity-60"
                />
              );
            })}
          </Pie>
          <Tooltip
            content={
              <PieChartCustomTooltip
                chartConfig={chartConfig}
                currentValue={currentValue}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <AnticaptureWatermark svgClassName="w-32" />
    </div>
  );
};
