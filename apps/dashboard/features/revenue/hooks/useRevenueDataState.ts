import { useMemo } from "react";

import {
  type CutoffFallback,
  type RevenueDataState,
  type RevenueQueryLike,
  toRevenueDataState,
} from "@/features/revenue/utils/meta";

/**
 * Items, freshness meta, data cutoff and availability of one revenue query,
 * stable across renders while the response is unchanged.
 */
export function useRevenueDataState<TData extends { items: unknown[] }>(
  query: RevenueQueryLike<TData>,
  cutoffFallback: CutoffFallback = "rows",
): RevenueDataState<TData["items"][number]> {
  const { data, isLoading, isError } = query;
  return useMemo(
    () =>
      toRevenueDataState(
        { data, isLoading, isError },
        new Date(),
        cutoffFallback,
      ),
    [data, isLoading, isError, cutoffFallback],
  );
}
