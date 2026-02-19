"use client";

import { useQueryState, parseAsStringEnum, parseAsString } from "nuqs";
import { useCallback, useMemo } from "react";
import {
  ActivityFeedFilterState,
  FeedEventRelevance,
} from "@/features/feed/types";
import { QueryInput_FeedEvents_Relevance } from "@anticapture/graphql-client";

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
  const [relevance, setRelevance] = useQueryState(
    "relevance",
    parseAsStringEnum([
      QueryInput_FeedEvents_Relevance.Low,
      QueryInput_FeedEvents_Relevance.Medium,
      QueryInput_FeedEvents_Relevance.High,
    ]).withDefault(QueryInput_FeedEvents_Relevance.Medium),
  );
  const [fromDate, setFromDate] = useQueryState("from", parseAsString);
  const [toDate, setToDate] = useQueryState("to", parseAsString);

  const filters: ActivityFeedFilterState = useMemo(
    () => ({
      sortOrder: sortOrder as "asc" | "desc",
      relevance: relevance as unknown as FeedEventRelevance,
      fromDate: fromDate ?? "",
      toDate: toDate ?? "",
    }),
    [sortOrder, relevance, fromDate, toDate],
  );

  const setFilters = useCallback(
    (newFilters: ActivityFeedFilterState) => {
      setSortOrder(newFilters.sortOrder);
      setRelevance(
        newFilters.relevance as unknown as QueryInput_FeedEvents_Relevance,
      );
      setFromDate(newFilters.fromDate || null);
      setToDate(newFilters.toDate || null);
    },
    [setSortOrder, setRelevance, setFromDate, setToDate],
  );

  const clearFilters = useCallback(() => {
    setSortOrder("desc");
    setRelevance(QueryInput_FeedEvents_Relevance.Medium);
    setFromDate(null);
    setToDate(null);
  }, [setSortOrder, setRelevance, setFromDate, setToDate]);

  return { filters, setFilters, clearFilters };
}
