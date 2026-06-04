import type { RevenueTotalsItem } from "@anticapture/client";

import type {
  RevenueSummary,
  RevenueTimeframe,
} from "@/features/revenue/types";
import { formatUsd } from "@/features/revenue/utils/format";
import {
  pctDelta,
  presentDelta,
  splitIntoWindows,
  sumBy,
} from "@/features/revenue/utils/window";

const toStartOfCurrentMonthUtcSeconds = (): number => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000;
};

const isInCurrentUtcYear = (item: RevenueTotalsItem): boolean => {
  const now = new Date();
  return new Date(item.date * 1000).getUTCFullYear() === now.getUTCFullYear();
};

const sumTotalUsd = (items: RevenueTotalsItem[]): number =>
  sumBy(items, (item) => item.totalUsd);

const computeActualRevenue = (
  items: RevenueTotalsItem[],
  timeframe: RevenueTimeframe,
): number => {
  if (timeframe === "ytd") return sumTotalUsd(items.filter(isInCurrentUtcYear));
  if (timeframe === "max") return sumTotalUsd(items);
  return sumTotalUsd(splitIntoWindows(items, 12).current);
};

const computeQoqDelta = (
  current: RevenueTotalsItem[],
  previous: RevenueTotalsItem[] | null,
): RevenueSummary["qoqDelta"] => {
  if (!previous) return undefined;

  const currentTotal = sumTotalUsd(current);
  const previousTotal = sumTotalUsd(previous);
  const qoq = pctDelta(currentTotal, previousTotal);
  if (qoq === null) return undefined;

  const presented = presentDelta(qoq);
  if (!presented.trend) return undefined;

  return {
    text: `${presented.text}% vs prior 3 months`,
    trend: presented.trend,
  };
};

export const computeRevenueSummary = (
  items: RevenueTotalsItem[],
  timeframe: RevenueTimeframe,
): RevenueSummary => {
  const actualRevenue = computeActualRevenue(items, timeframe);
  const completedItems = items.filter(
    (item) => item.date < toStartOfCurrentMonthUtcSeconds(),
  );
  const { current, previous } = splitIntoWindows(completedItems, 3);
  const trailingThreeMonthTotal = sumTotalUsd(current);

  return {
    actualAmount: formatUsd(actualRevenue),
    runRate: formatUsd(trailingThreeMonthTotal * 4),
    qoqDelta: computeQoqDelta(current, previous),
  };
};
