"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Activity, Filter } from "lucide-react";
import { cn } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { Button } from "@/shared/components";
import { useActivityFeed } from "@/features/activity-feed/hooks/useActivityFeed";
import { FeedEventItem } from "@/features/activity-feed/components/FeedEventItem";
import { FeedEventSkeleton } from "@/features/activity-feed/components/FeedEventSkeleton";
import { ActivityFeedFiltersDrawer } from "@/features/activity-feed/components/ActivityFeedFilters";
import {
  ActivityFeedFilterState,
  FeedEvent,
} from "@/features/activity-feed/types";

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

// Helper to get local date key (YYYY-MM-DD in local timezone)
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to group events by date
const groupEventsByDate = (events: FeedEvent[]) => {
  const groups: {
    label: string;
    date: string;
    events: FeedEvent[];
    highRelevanceCount: number;
  }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const currentYear = today.getFullYear();

  const todayKey = getLocalDateKey(today);
  const yesterdayKey = getLocalDateKey(yesterday);

  const eventsByDate = new Map<string, FeedEvent[]>();

  events.forEach((event) => {
    const eventDate = new Date(Number(event.timestamp) * 1000);
    const dateKey = getLocalDateKey(eventDate);

    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // Sort dates in descending order (comparing date strings works for YYYY-MM-DD format)
  const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) =>
    b.localeCompare(a),
  );

  sortedDates.forEach((dateKey) => {
    const dateEvents = eventsByDate.get(dateKey)!;
    // Parse the local date key back to a date at midnight local time
    const [year, month, day] = dateKey.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);
    const isCurrentYear = year === currentYear;

    let label: string;
    if (dateKey === todayKey) {
      label = "TODAY";
    } else if (dateKey === yesterdayKey) {
      label = "YESTERDAY";
    } else {
      const formatOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        month: "short",
        day: "numeric",
        ...(isCurrentYear ? {} : { year: "numeric" }),
      };
      label = eventDate
        .toLocaleDateString("en-US", formatOptions)
        .toUpperCase();
    }

    const highRelevanceCount = dateEvents.filter(
      (e) => e.relevance === "high",
    ).length;

    groups.push({
      label,
      date: dateKey,
      events: dateEvents,
      highRelevanceCount,
    });
  });

  return groups;
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
    date.setHours(23, 59, 59, 999);
    return Math.floor(date.getTime() / 1000);
  }, [filters.toDate]);

  const {
    data: events,
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

  // Group events by date
  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  return (
    <section className={cn("flex flex-col gap-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-surface-contrast mt-1 flex size-10 items-center justify-center rounded-lg">
            <Activity className="text-primary size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-primary text-2xl font-semibold">
              Activity Feed
            </h1>
            <p className="text-secondary text-sm">
              Surfaces governance activity that helps assess DAO health, power
              shifts, and emerging risks.
            </p>
          </div>
        </div>

        {/* Filter button */}
        <Button
          variant="outline"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="shrink-0 gap-2"
        >
          <Filter className="size-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="text-primary">({activeFiltersCount})</span>
          )}
        </Button>
      </div>

      {/* Filter Drawer */}
      <ActivityFeedFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Feed content */}
      <div className="flex flex-col">
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
          <div className="flex flex-col">
            {Array.from({ length: 10 }).map((_, i) => (
              <FeedEventSkeleton key={i} />
            ))}
          </div>
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

        {groupedEvents.length > 0 && (
          <div className="flex flex-col">
            {groupedEvents.map((group) => (
              <div key={group.date} className="flex flex-col">
                {/* Date header */}
                <div className="flex items-center gap-2 py-3">
                  <span className="text-secondary font-mono text-xs font-medium tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-dimmed">•</span>
                  <span className="text-dimmed font-mono text-xs">
                    {group.highRelevanceCount} HIGH RELEVANCE{" "}
                    {group.highRelevanceCount === 1 ? "ACTIVITY" : "ACTIVITIES"}
                  </span>
                </div>

                {/* Events */}
                <div className="flex flex-col">
                  {group.events.map((event) => (
                    <FeedEventItem
                      key={`${event.txHash}-${event.logIndex}`}
                      event={event}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {pagination.hasNextPage && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={fetchNextPage}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
