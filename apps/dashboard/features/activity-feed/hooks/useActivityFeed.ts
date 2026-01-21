"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { DaoIdEnum } from "@/shared/types/daos";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import {
  ActivityFeedFilters,
  FeedEvent,
  FeedEventListResponse,
} from "@/features/activity-feed/types";
import { USE_MOCK_DATA, MOCK_FEED_DATA } from "./mockData";

const buildQueryParams = (filters: ActivityFeedFilters): string => {
  const params = new URLSearchParams();

  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.fromTimestamp)
    params.append("fromTimestamp", filters.fromTimestamp.toString());
  if (filters.toTimestamp)
    params.append("toTimestamp", filters.toTimestamp.toString());

  if (filters.types && filters.types.length > 0) {
    filters.types.forEach((type) => params.append("types", type));
  }

  if (filters.relevances && filters.relevances.length > 0) {
    filters.relevances.forEach((relevance) =>
      params.append("relevances", relevance),
    );
  }

  return params.toString();
};

const fetchActivityFeed = async (
  daoId: DaoIdEnum,
  filters: ActivityFeedFilters,
): Promise<FeedEventListResponse> => {
  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    const items = MOCK_FEED_DATA.items.slice(offset, offset + limit);

    return {
      items,
      totalCount: MOCK_FEED_DATA.totalCount,
    };
  }

  const queryString = buildQueryParams(filters);
  const url = `${BACKEND_ENDPOINT}/feed${queryString ? `?${queryString}` : ""}`;

  const response = await axios.get<FeedEventListResponse>(url, {
    headers: {
      "anticapture-dao-id": daoId,
    },
  });

  return response.data;
};

interface UseActivityFeedParams {
  daoId: DaoIdEnum;
  filters?: ActivityFeedFilters;
  enabled?: boolean;
}

interface PaginationInfo {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  itemsPerPage: number;
}

// Helper to create unique key for deduplication
const getEventKey = (event: FeedEvent): string =>
  `${event.txHash}-${event.logIndex}`;

// Helper to deduplicate events
const deduplicateEvents = (events: FeedEvent[]): FeedEvent[] => {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = getEventKey(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const useActivityFeed = ({
  daoId,
  filters = {},
  enabled = true,
}: UseActivityFeedParams) => {
  const limit = filters.limit ?? 20;
  const [allItems, setAllItems] = useState<FeedEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isFetchingRef = useRef(false);

  // Create a stable filters hash for resetting
  const filtersHash = useMemo(
    () =>
      JSON.stringify({
        daoId,
        types: filters.types,
        relevances: filters.relevances,
        fromTimestamp: filters.fromTimestamp,
        toTimestamp: filters.toTimestamp,
        sortOrder: filters.sortOrder,
      }),
    [daoId, filters],
  );

  // Reset when filters change
  useEffect(() => {
    setAllItems([]);
    setTotalCount(0);
    setIsInitialLoad(true);
    isFetchingRef.current = false;
  }, [filtersHash]);

  // Fetch initial data
  useEffect(() => {
    if (!enabled || !isInitialLoad) return;

    const fetchInitial = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const data = await fetchActivityFeed(daoId, {
          ...filters,
          limit,
          offset: 0,
        });
        setAllItems(deduplicateEvents(data.items));
        setTotalCount(data.totalCount);
      } catch (err) {
        console.error("Error fetching activity feed:", err);
      } finally {
        setIsInitialLoad(false);
        isFetchingRef.current = false;
      }
    };

    fetchInitial();
  }, [daoId, filters, limit, enabled, isInitialLoad]);

  const pagination: PaginationInfo = useMemo(() => {
    const hasNextPage = totalCount > allItems.length;
    return {
      totalCount,
      hasNextPage,
      hasPreviousPage: false,
      currentPage: Math.ceil(allItems.length / limit) || 1,
      itemsPerPage: limit,
    };
  }, [totalCount, allItems.length, limit]);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isLoadingMore || isFetchingRef.current)
      return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextOffset = allItems.length;
      const moreData = await fetchActivityFeed(daoId, {
        ...filters,
        limit,
        offset: nextOffset,
      });

      setAllItems((prev) => deduplicateEvents([...prev, ...moreData.items]));
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [
    daoId,
    filters,
    limit,
    pagination.hasNextPage,
    isLoadingMore,
    allItems.length,
  ]);

  const refetch = useCallback(() => {
    setAllItems([]);
    setTotalCount(0);
    setIsInitialLoad(true);
    isFetchingRef.current = false;
  }, []);

  return {
    data: allItems,
    totalCount,
    loading: isInitialLoad,
    error: null,
    refetch,
    pagination,
    fetchNextPage,
    isLoadingMore,
  };
};
