"use client";

import {
  QueryInput_FeedEvents_Relevance,
  QueryInput_FeedEvents_Type,
} from "@anticapture/graphql-client";
import { useQueryState, parseAsStringEnum, parseAsString } from "nuqs";
import { useCallback, useMemo } from "react";

import {
  ActivityFeedFilterState,
  FeedEventRelevance,
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
      QueryInput_FeedEvents_Relevance.Low,
      QueryInput_FeedEvents_Relevance.Medium,
      QueryInput_FeedEvents_Relevance.High,
    ]).withDefault(QueryInput_FeedEvents_Relevance.Medium),
  );
  const [fromDate, setFromDate] = useQueryState("from", parseAsString);
  const [toDate, setToDate] = useQueryState("to", parseAsString);
  const [eventType, setEventType] = useQueryState(
    "type",
    parseAsStringEnum([
      QueryInput_FeedEvents_Type.Vote,
      QueryInput_FeedEvents_Type.Proposal,
      QueryInput_FeedEvents_Type.ProposalExtended,
      QueryInput_FeedEvents_Type.Transfer,
      QueryInput_FeedEvents_Type.Delegation,
    ]),
  );

  const filters: ActivityFeedFilterState = useMemo(
    () => ({
      sortOrder: sortOrder as "asc" | "desc",
      relevance: relevance as unknown as FeedEventRelevance,
      fromDate: fromDate ?? "",
      toDate: toDate ?? "",
      type: (eventType as unknown as FeedEventType) ?? undefined,
    }),
    [sortOrder, relevance, fromDate, toDate, eventType],
  );

  const setFilters = useCallback(
    (newFilters: ActivityFeedFilterState) => {
      setSortOrder(newFilters.sortOrder);
      setRelevance(
        newFilters.relevance as unknown as QueryInput_FeedEvents_Relevance,
      );
      setFromDate(newFilters.fromDate || null);
      setToDate(newFilters.toDate || null);
      setEventType(
        (newFilters.type as unknown as
          | QueryInput_FeedEvents_Type.Vote
          | QueryInput_FeedEvents_Type.Proposal
          | QueryInput_FeedEvents_Type.ProposalExtended
          | QueryInput_FeedEvents_Type.Transfer
          | QueryInput_FeedEvents_Type.Delegation) ?? null,
      );
    },
    [setSortOrder, setRelevance, setFromDate, setToDate, setEventType],
  );

  const clearFilters = useCallback(() => {
    setSortOrder("desc");
    setRelevance(QueryInput_FeedEvents_Relevance.Medium);
    setFromDate(null);
    setToDate(null);
    setEventType(null);
  }, [setSortOrder, setRelevance, setFromDate, setToDate, setEventType]);

  return { filters, setFilters, clearFilters };
}
