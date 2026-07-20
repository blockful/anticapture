"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";

import { useApiKeyUsage } from "@/features/api-keys/hooks/useApiKeyUsage";
import { transformApiKeyUsage } from "@/features/api-keys/utils/transform";

const ALL_KEYS = "all";
const requestCountFormatter = new Intl.NumberFormat("en-US");

const formatRequestCount = (value: number): string =>
  requestCountFormatter.format(value);

const filterLabel = (label: string): string =>
  label.length > 18 ? `${label.slice(0, 17)}…` : label;

export const UsageSection = ({
  keys,
  userId,
}: {
  keys: UserApiKey[];
  userId: string | null;
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState(ALL_KEYS);
  const { usage, isLoading, isError } = useApiKeyUsage(userId);
  const todayUtcDay = new Date().toISOString().slice(0, 10);
  const today = useMemo(
    () => new Date(`${todayUtcDay}T00:00:00.000Z`),
    [todayUtcDay],
  );
  const activeKeyId =
    selectedKeyId === ALL_KEYS || keys.some(({ id }) => id === selectedKeyId)
      ? selectedKeyId
      : ALL_KEYS;
  const chart = useMemo(
    () => transformApiKeyUsage(usage, keys, today, activeKeyId),
    [activeKeyId, keys, today, usage],
  );
  const filterOptions = useMemo(
    () => [
      { label: "All", value: ALL_KEYS },
      ...keys.map(({ id, label }) => ({
        label: filterLabel(label),
        value: id,
      })),
    ],
    [keys],
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="text-secondary text-sm font-medium">
            Requests · Last 30 days
          </p>
          <Tooltip
            tooltipContent={
              <p className="text-secondary text-sm font-normal leading-5">
                Counts every authenticated request made with your API keys.
                Usage can take up to a minute to appear.
              </p>
            }
            triggerClassName="inline-flex cursor-help items-center border-0 bg-transparent p-0"
          >
            <Info className="text-secondary size-3.5" />
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-secondary hidden text-sm font-medium lg:inline">
            Key
          </span>
          <SegmentedControl
            items={filterOptions}
            value={activeKeyId}
            size="sm"
            onValueChange={setSelectedKeyId}
            className="hidden max-w-full overflow-x-auto lg:inline-flex"
          />
          <select
            value={activeKeyId}
            onChange={(event) => setSelectedKeyId(event.target.value)}
            aria-label="Filter usage by API key"
            className="border-border-default bg-surface-default text-primary rounded-base border px-2 py-1 text-xs font-medium lg:hidden"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface-raised h-[300px] w-full animate-pulse rounded" />
      ) : isError ? (
        <div className="flex h-[300px] w-full flex-col items-center justify-center gap-1 text-center">
          <p className="text-primary text-sm font-medium">Usage unavailable</p>
          <p className="text-secondary text-sm">Try refreshing the page.</p>
        </div>
      ) : chart.hasUsage ? (
        <StackedBarChart
          series={chart.series}
          xAxisLabels={chart.xAxisLabels}
          yAxisFormatter={formatRequestCount}
          xAxisLabelInterval={(index) => index % 5 === 0 || index === 29}
          xAxisLabelFormatter={(value) => value}
          tooltipTotalLabel="Total"
          height={300}
        />
      ) : (
        <div className="flex h-[300px] w-full items-center justify-center">
          <p className="text-secondary text-sm">No requests yet</p>
        </div>
      )}
    </Card>
  );
};
