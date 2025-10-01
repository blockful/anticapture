"use client";

import { TooltipProps } from "recharts";
import { formatNumberUserReadable } from "@/shared/utils";
import { metricsSchema } from "@/features/token-distribution/utils/metrics";
import { DaoIdEnum } from "@/shared/types/daos";

export const TokenDistributionCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<string, { label: string; color: string }>;
    daoId: DaoIdEnum;
  }
> = ({ active, payload, label, chartConfig, daoId }) => {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(Number(label) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  // Filter valid entries
  const validEntries = payload.filter((entry) => {
    const value = entry.value !== undefined ? entry.value : 0;
    // Don't show if value is 0, undefined, null, or empty string
    // BUT show non-empty strings (like proposal titles)
    return (
      value !== 0 &&
      value !== undefined &&
      value !== null &&
      (typeof value === "string" ? (value as string).length > 0 : true)
    );
  });

  // Group entries by category using metrics schema
  const groupedByCategory = validEntries.reduce(
    (acc, entry) => {
      const metricKey = entry.name as keyof typeof metricsSchema;
      const category = metricsSchema[metricKey]?.category;

      if (category) {
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(entry);
      }
      return acc;
    },
    {} as Record<string, typeof validEntries>,
  );

  // Get ordered categories from available data
  const orderedCategories = Object.keys(groupedByCategory);

  return (
    <div className="flex max-w-xs flex-col gap-2 rounded-lg border border-[#27272A] bg-[#09090b] p-3 shadow-md">
      <p className="text-xs font-medium leading-[14px] text-neutral-50">
        {date}
      </p>
      {orderedCategories.map((category) => (
        <div key={category}>
          <p className="text-alternative-xsmall text-secondary mb-1 font-mono font-medium uppercase">
            {category}
          </p>
          <div className="flex flex-col gap-1">
            {groupedByCategory[category].map((entry, index) => {
              const value = entry.value !== undefined ? entry.value : 0;

              const formattedName =
                chartConfig[entry.name as keyof typeof chartConfig]?.label ??
                entry.name;

              // Use chartConfig color instead of entry.color for better consistency
              const displayColor =
                chartConfig[entry.name as keyof typeof chartConfig]?.color ||
                entry.color;

              // Check if this metric should NOT have daoId suffix
              const shouldSkipDaoId =
                entry.name === "PROPOSALS_GOVERNANCE" ||
                entry.name === "TOKEN_PRICE";

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
                      : `${formatNumberUserReadable(
                          Number.isFinite(value) ? Math.floor(value) : 0,
                        )}${shouldSkipDaoId ? "" : ` ${daoId}`}`}
                  </strong>
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
