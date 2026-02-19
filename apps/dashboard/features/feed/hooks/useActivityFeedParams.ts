"use client";

import { useQueryState, parseAsStringEnum, parseAsString } from "nuqs";
import { useCallback, useMemo } from "react";
import {
  ActivityFeedFilterState,
  // FeedEventType,
  // FeedEventRelevance,
} from "@/features/feed/types";

// const VALID_TYPES: FeedEventType[] = [
//   "vote",
//   "proposal",
//   "transfer",
//   "delegation",
// ];
// const VALID_RELEVANCES: FeedEventRelevance[] = [
//   "none",
//   "low",
//   "medium",
//   "high",
// ];

// Parse comma-separated string to array, filtering invalid values
const parseArrayParam = <T extends string>(
  value: string | null,
  validValues: T[],
): T[] => {
  if (!value) return [];
  return value.split(",").filter((v): v is T => validValues.includes(v as T));
};

// Convert array to comma-separated string, or null if empty
const serializeArrayParam = (values: string[]): string | null => {
  return values.length > 0 ? values.join(",") : null;
};

export interface UseActivityFeedParamsReturn {
  filters: ActivityFeedFilterState;
  setFilters: (filters: ActivityFeedFilterState) => void;
  clearFilters: () => void;
}

export function useActivityFeedParams(): UseActivityFeedParamsReturn {
  const [sortOrder, setSortOrder] = useQueryState(
    "sort",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const [typesParam, setTypesParam] = useQueryState("types", parseAsString);
  const [relevancesParam, setRelevancesParam] = useQueryState(
    "relevances",
    parseAsString,
  );
  const [fromDate, setFromDate] = useQueryState("from", parseAsString);
  const [toDate, setToDate] = useQueryState("to", parseAsString);

  const filters: ActivityFeedFilterState = useMemo(
    () => ({
      sortOrder: sortOrder as "asc" | "desc",
      // types: parseArrayParam(typesParam, VALID_TYPES),
      // relevances: parseArrayParam(relevancesParam, VALID_RELEVANCES),
      fromDate: fromDate ?? "",
      toDate: toDate ?? "",
    }),
    [sortOrder, typesParam, relevancesParam, fromDate, toDate],
  );

  const setFilters = useCallback(
    (newFilters: ActivityFeedFilterState) => {
      setSortOrder(newFilters.sortOrder);
      // setTypesParam(serializeArrayParam(newFilters.types));
      // setRelevancesParam(serializeArrayParam(newFilters.relevances));
      setFromDate(newFilters.fromDate || null);
      setToDate(newFilters.toDate || null);
    },
    [setSortOrder, setTypesParam, setRelevancesParam, setFromDate, setToDate],
  );

  const clearFilters = useCallback(() => {
    setSortOrder("desc");
    setTypesParam(null);
    setRelevancesParam(null);
    setFromDate(null);
    setToDate(null);
  }, [setSortOrder, setTypesParam, setRelevancesParam, setFromDate, setToDate]);

  return { filters, setFilters, clearFilters };
}
