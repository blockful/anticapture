"use client";

import { formatNumberUserReadable } from "@/shared/utils/";
import { TooltipProps } from "recharts";

export const AttackProfitabilityCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<string, { label: string }>;
  }
> = ({ active, payload, label, chartConfig }) => {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(label).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  return (
    <div className="flex flex-col rounded-lg border border-[#27272A] bg-[#09090b] p-3 text-black shadow-md">
      <p className="flex pb-2 text-xs leading-[14px] font-medium text-neutral-50">
        {date}
      </p>
      {payload.map((entry, index) => {
        const value = entry.value !== undefined ? entry.value : 0;
        const formattedName =
          chartConfig[entry.name as keyof typeof chartConfig]?.label ??
          entry.name;

        return (
          <p
            key={index}
            style={{ color: entry.color }}
            className="flex gap-1.5"
          >
            {formattedName}:{" "}
            <strong>
              {value !== 0 ? `$${formatNumberUserReadable(value)}` : "No Data"}
            </strong>
          </p>
        );
      })}
    </div>
  );
};
