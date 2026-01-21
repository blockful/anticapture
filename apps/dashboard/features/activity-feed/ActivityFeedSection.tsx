"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Activity, RefreshCw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { IconButton } from "@/shared/components";
import { useActivityFeed } from "@/features/activity-feed/hooks/useActivityFeed";
import { FeedEventItem } from "@/features/activity-feed/components/FeedEventItem";
import { FeedEventSkeleton } from "@/features/activity-feed/components/FeedEventSkeleton";
import { ActivityFeedFiltersDrawer } from "@/features/activity-feed/components/ActivityFeedFilters";
import { ActivityFeedFilterState } from "@/features/activity-feed/types";

interface ActivityFeedSectionProps {
  className?: string;
}

const DEFAULT_FILTERS: ActivityFeedFilterState = {
  sortOrder: "desc",
  types: [],
  relevances: [],
  fromDate: "",
  toDate: "",
};

export const ActivityFeedSection = ({
  className,
}: ActivityFeedSectionProps) => {
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] =
    useState<ActivityFeedFilterState>(DEFAULT_FILTERS);

  // Convert date strings to timestamps
  const fromTimestamp = useMemo(() => {
    if (!filters.fromDate) return undefined;
    const date = new Date(filters.fromDate);
    return Math.floor(date.getTime() / 1000);
  }, [filters.fromDate]);

  const toTimestamp = useMemo(() => {
    if (!filters.toDate) return undefined;
    const date = new Date(filters.toDate);
    // Set to end of day
    date.setHours(23, 59, 59, 999);
    return Math.floor(date.getTime() / 1000);
  }, [filters.toDate]);

  const {
    data: events,
    totalCount,
    loading,
    error,
    refetch,
    pagination,
    fetchNextPage,
    isLoadingMore,
  } = useActivityFeed({
    daoId: daoId.toUpperCase() as DaoIdEnum,
    filters: {
      limit: 20,
      sortOrder: filters.sortOrder,
      types: filters.types.length > 0 ? filters.types : undefined,
      relevances:
        filters.relevances.length > 0 ? filters.relevances : undefined,
      fromTimestamp,
      toTimestamp,
    },
  });

  const handleApplyFilters = (newFilters: ActivityFeedFilterState) => {
    setFilters(newFilters);
  };

  const activeFiltersCount =
    filters.types.length +
    filters.relevances.length +
    (filters.fromDate ? 1 : 0) +
    (filters.toDate ? 1 : 0) +
    (filters.sortOrder !== "desc" ? 1 : 0);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-brand size-5" />
          <h2 className="text-primary text-xl font-semibold">Activity Feed</h2>
          {!loading && (
            <span className="text-secondary text-sm">
              ({totalCount} events)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter button */}
          <div className="relative">
            <IconButton
              variant="outline"
              size="md"
              icon={SlidersHorizontal}
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-label="Open filters"
            />
            {activeFiltersCount > 0 && (
              <span className="bg-highlight text-surface-background absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {/* Refresh button */}
          <IconButton
            variant="outline"
            size="md"
            icon={RefreshCw}
            iconClassName={cn(loading && "animate-spin")}
            onClick={refetch}
            disabled={loading}
            aria-label="Refresh"
          />
        </div>
      </div>

      {/* Filter Drawer */}
      <ActivityFeedFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Feed content */}
      <div className="border-border-default bg-surface-default overflow-hidden rounded-lg border">
        {error && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
            <p className="text-error text-sm">Failed to load activity feed</p>
            <button
              onClick={refetch}
              className="text-link hover:text-link-hover text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading && events.length === 0 && (
          <>
            {Array.from({ length: 10 }).map((_, i) => (
              <FeedEventSkeleton key={i} />
            ))}
          </>
        )}

        {!loading && events.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
            <Activity className="text-secondary size-8" />
            <p className="text-secondary text-sm">No activity found</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-link hover:text-link-hover text-sm underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {events.length > 0 && (
          <>
            {events.map((event) => (
              <FeedEventItem
                key={`${event.txHash}-${event.logIndex}`}
                event={event}
              />
            ))}

            {/* Load more */}
            {pagination.hasNextPage && (
              <div className="flex justify-center px-4 py-4">
                <button
                  onClick={fetchNextPage}
                  disabled={isLoadingMore}
                  className="bg-surface-contrast hover:bg-surface-hover text-secondary hover:text-primary rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
