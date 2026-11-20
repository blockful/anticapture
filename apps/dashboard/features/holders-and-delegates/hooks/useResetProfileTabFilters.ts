"use client";

import { parseAsString, useQueryState, useQueryStates } from "nuqs";

/**
 * Every profile tab keeps its sort and filters in the URL under generic names
 * (`orderBy`, `from`, `type`...). They mean different things per tab, so they
 * are cleared whenever the tab changes, or a filter from one tab would leak
 * into the next.
 */
export const useResetProfileTabFilters = () => {
  const setSortOrder = useQueryState("orderDirection")[1];
  const setSortBy = useQueryState("orderBy")[1];
  const setIsFilterActive = useQueryState("active")[1];
  const setFilterVariables = useQueryStates({
    minDelta: parseAsString,
    maxDelta: parseAsString,
  })[1];
  const setToFilter = useQueryState("to")[1];
  const setFromFilter = useQueryState("from")[1];
  const setSelectedPeriod = useQueryState("selectedPeriod")[1];
  const setTypeFilter = useQueryState("type")[1];
  const setTabAddress = useQueryState("tabAddress")[1];
  const setFeedOrder = useQueryState("feedOrder")[1];
  const setFeedRelevance = useQueryState("feedRelevance")[1];
  const setUserVoteFilter = useQueryState("userVoteFilter")[1];

  return () => {
    setSortOrder(null);
    setSortBy(null);
    setIsFilterActive(null);
    setFilterVariables({
      minDelta: null,
      maxDelta: null,
    });
    setToFilter(null);
    setFromFilter(null);
    setSelectedPeriod(null);
    setTypeFilter(null);
    setTabAddress(null);
    setFeedOrder(null);
    setFeedRelevance(null);
    setUserVoteFilter(null);
  };
};
