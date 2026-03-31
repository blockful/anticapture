"use client";

import { useQueryState, parseAsStringEnum, parseAsString } from "nuqs";
import { useCallback, useMemo } from "react";

import type {
  ActivityFeedFilterState,
  FeedEventRelevance,
} from "@/features/feed/types";
import {
  FeedEventRelevance as FeedRelevance,
  FeedEventType,
} from "@/features/feed/types";

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
      FeedRelevance.Low,
      FeedRelevance.Medium,
      FeedRelevance.High,
    ]).withDefault(FeedRelevance.Medium),
  );
  const [fromDate, setFromDate] = useQueryState("from", parseAsString);
  const [toDate, setToDate] = useQueryState("to", parseAsString);
  const [eventType, setEventType] = useQueryState(
    "type",
    parseAsStringEnum([
      FeedEventType.Vote,
      FeedEventType.Proposal,
      FeedEventType.ProposalExtended,
      FeedEventType.Transfer,
      FeedEventType.Delegation,
    ]),
  );

  const filters: ActivityFeedFilterState = useMemo(
    () => ({
      sortOrder: sortOrder as "asc" | "desc",
      relevance: relevance as FeedEventRelevance,
      fromDate: fromDate ?? "",
      toDate: toDate ?? "",
      type: (eventType as FeedEventType) ?? undefined,
    }),
    [sortOrder, relevance, fromDate, toDate, eventType],
  );

  const setFilters = useCallback(
    (newFilters: ActivityFeedFilterState) => {
      setSortOrder(newFilters.sortOrder);
      setRelevance(newFilters.relevance ?? null);
      setFromDate(newFilters.fromDate || null);
      setToDate(newFilters.toDate || null);
      setEventType(newFilters.type ?? null);
    },
    [setSortOrder, setRelevance, setFromDate, setToDate, setEventType],
  );

  const clearFilters = useCallback(() => {
    setSortOrder("desc");
    setRelevance(FeedRelevance.Medium);
    setFromDate(null);
    setToDate(null);
    setEventType(null);
  }, [setSortOrder, setRelevance, setFromDate, setToDate, setEventType]);

  return { filters, setFilters, clearFilters };
}
