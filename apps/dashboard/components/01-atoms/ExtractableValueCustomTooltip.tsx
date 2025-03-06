"use client";

import {
  timestampToReadableDate,
  formatNumberUserReadable,
} from "@/lib/client/utils";
import { TooltipProps } from "recharts";

export const ExtractableValueCustomTooltip: React.FC<
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
    <div className="gap-2 rounded bg-[#09090b] p-3 text-black shadow-md">
      <p className="text-xs font-medium leading-[14px] text-neutral-50">
        {date}
      </p>
      {payload.map((entry, index) => {
        const value = entry.value !== undefined ? entry.value : 0;
        const formattedName =
          chartConfig[entry.name as keyof typeof chartConfig]?.label ??
          entry.name;

        return (
          <p key={index} style={{ color: entry.color }}>
            {formattedName}:{" "}
            <strong>
              {value !== 0 ? formatNumberUserReadable(value) : "No Data"}
            </strong>
          </p>
        );
      })}
    </div>
  );
};
