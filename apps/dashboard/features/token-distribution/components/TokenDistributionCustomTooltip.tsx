"use client";

import { TooltipProps } from "recharts";
import {
  formatNumberUserReadable,
  timestampToReadableDate,
} from "@/shared/utils";

export const TokenDistributionCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<string, { label: string; color: string }>;
  }
> = ({ active, payload, label, chartConfig }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="max-w-xs rounded bg-white p-2 text-black shadow-md">
      <p className="font-bold">
        Date: {timestampToReadableDate(Number(label))}
      </p>
      {payload
        .filter((entry) => {
          const value = entry.value !== undefined ? entry.value : 0;
          // Don't show if value is 0, undefined, null, or empty string
          // BUT show non-empty strings (like proposal titles)
          return (
            value !== 0 &&
            value !== undefined &&
            value !== null &&
            (typeof value === "string" ? (value as string).length > 0 : true)
          );
        })
        .map((entry, index) => {
          const value = entry.value !== undefined ? entry.value : 0;

          const formattedName =
            chartConfig[entry.name as keyof typeof chartConfig]?.label ??
            entry.name;

          // Use chartConfig color instead of entry.color for better consistency
          const displayColor =
            chartConfig[entry.name as keyof typeof chartConfig]?.color ||
            entry.color;

          return (
            <p
              key={index}
              style={{ color: displayColor }}
              className="break-words"
            >
              {formattedName}:{" "}
              <strong
                className={typeof value === "string" ? "break-words" : ""}
              >
                {typeof value === "string"
                  ? value
                  : formatNumberUserReadable(
                      Number.isFinite(value) ? Math.floor(value) : 0,
                    )}
              </strong>
            </p>
          );
        })}
    </div>
  );
};
