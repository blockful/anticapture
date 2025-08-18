"use client";

import { TooltipProps } from "recharts";
import {
  formatNumberUserReadable,
  timestampToReadableDate,
} from "@/shared/utils";

export const TokenDistributionCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<string, { label: string }>;
  }
> = ({ active, payload, label, chartConfig }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded bg-white p-2 text-black shadow-md">
      <p className="font-bold">
        Date: {timestampToReadableDate(Number(label))}
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
              {value !== 0
                ? formatNumberUserReadable(
                    Number.isFinite(value) ? Math.floor(value) : 0,
                  )
                : "No Data"}
            </strong>
          </p>
        );
      })}
    </div>
  );
};
