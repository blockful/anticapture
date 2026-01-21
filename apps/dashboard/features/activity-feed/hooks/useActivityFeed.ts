"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
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

export const useActivityFeed = ({
  daoId,
  filters = {},
  enabled = true,
}: UseActivityFeedParams) => {
  const limit = filters.limit ?? 20;
  const [allItems, setAllItems] = useState<FeedEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Create a stable key for SWR
  const swrKey = useMemo(() => {
    if (!enabled) return null;
    return [
      "activity-feed",
      daoId,
      JSON.stringify({ ...filters, limit, offset: 0 }),
    ];
  }, [daoId, filters, limit, enabled]);

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => fetchActivityFeed(daoId, { ...filters, limit, offset: 0 }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  // Reset state when filters change
  const filtersHash = useMemo(
    () =>
      JSON.stringify({
        types: filters.types,
        relevances: filters.relevances,
        fromTimestamp: filters.fromTimestamp,
        toTimestamp: filters.toTimestamp,
        sortOrder: filters.sortOrder,
      }),
    [filters],
  );

  useEffect(() => {
    setAllItems([]);
    setCurrentPage(1);
  }, [filtersHash, daoId]);

  // Update allItems when initial data loads
  useEffect(() => {
    if (data?.items) {
      setAllItems(data.items);
    }
  }, [data]);

  const totalCount = data?.totalCount ?? 0;

  const pagination: PaginationInfo = useMemo(() => {
    const hasNextPage = totalCount > allItems.length;
    return {
      totalCount,
      hasNextPage,
      hasPreviousPage: currentPage > 1,
      currentPage,
      itemsPerPage: limit,
    };
  }, [totalCount, allItems.length, currentPage, limit]);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextOffset = allItems.length;
      const moreData = await fetchActivityFeed(daoId, {
        ...filters,
        limit,
        offset: nextOffset,
      });

      setAllItems((prev) => [...prev, ...moreData.items]);
      setCurrentPage((p) => p + 1);
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsLoadingMore(false);
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
    setCurrentPage(1);
    mutate();
  }, [mutate]);

  return {
    data: allItems,
    totalCount,
    loading: isLoading,
    error,
    refetch,
    pagination,
    fetchNextPage,
    isLoadingMore,
  };
};
