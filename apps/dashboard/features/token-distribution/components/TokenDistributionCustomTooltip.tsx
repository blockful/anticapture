"use client";

import { TooltipProps } from "recharts";
import { formatNumberUserReadable } from "@/shared/utils";

export const TokenDistributionCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<string, { label: string; color: string }>;
  }
> = ({ active, payload, label, chartConfig }) => {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(Number(label) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  return (
    <div className="flex max-w-xs flex-col rounded-lg border border-[#27272A] bg-[#09090b] p-3 shadow-md">
      <p className="flex pb-2 text-xs font-medium leading-[14px] text-neutral-50">
        {date}
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
              className="flex gap-1.5 break-words"
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
