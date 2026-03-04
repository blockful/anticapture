"use client";

import { Activity, Filter, Loader2, Newspaper } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";

import { ActivityFeedFiltersDrawer } from "@/features/feed/components/ActivityFeedFilters";
import { FeedEventItem } from "@/features/feed/components/FeedEventItem";
import { FeedEventSkeleton } from "@/features/feed/components/FeedEventSkeleton";
import { useActivityFeed } from "@/features/feed/hooks/useActivityFeed";
import { useActivityFeedParams } from "@/features/feed/hooks/useActivityFeedParams";
import { FeedEvent, FeedEventRelevance } from "@/features/feed/types";
import {
  EntityType,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import { Button, BlankSlate, TheSectionLayout } from "@/shared/components";
import {
  SubSectionsContainer,
  BulletDivider,
} from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils";

interface ActivityFeedSectionProps {
  className?: string;
}

// Helper to get local date key (YYYY-MM-DD in local timezone)
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to group events by date
const groupEventsByDate = (
  events: FeedEvent[],
  sortOrder: "asc" | "desc" = "desc",
) => {
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

  // Sort dates to match the selected sort order
  const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) =>
    sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a),
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
      (e) => e.relevance === FeedEventRelevance.High,
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
  const [drawerState, setDrawerState] = useState<{
    address: string;
    entityType: EntityType;
  } | null>(null);
  const { filters, setFilters, clearFilters } = useActivityFeedParams();

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
      relevance: filters.relevance,
      type: filters.type,
      fromTimestamp,
      toTimestamp,
    },
  });

  const activeFiltersCount =
    (filters.fromDate ? 1 : 0) +
    (filters.toDate ? 1 : 0) +
    (filters.sortOrder !== "desc" ? 1 : 0) +
    (filters.relevance !== FeedEventRelevance.Medium ? 1 : 0) +
    (filters.type ? 1 : 0);

  // Group events by date
  const groupedEvents = useMemo(
    () => groupEventsByDate(events, filters.sortOrder),
    [events, filters.sortOrder],
  );

  // Infinite scroll with Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        pagination.hasNextPage &&
        !isLoadingMore &&
        !loading
      ) {
        fetchNextPage();
      }
    },
    [pagination.hasNextPage, isLoadingMore, loading, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "200px", // Start loading before reaching the bottom
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection]);

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.activityFeed.title}
      icon={<Newspaper className="section-layout-icon" />}
      description={PAGES_CONSTANTS.activityFeed.description}
      headerAction={
        <Button
          variant="primary"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="w-full shrink-0 gap-1 lg:w-auto"
        >
          <Filter className="size-4" />
          Filters
        </Button>
      }
    >
      {/* Holders / Delegates Drawer */}
      {drawerState && (
        <HoldersAndDelegatesDrawer
          isOpen={true}
          onClose={() => setDrawerState(null)}
          entityType={drawerState.entityType}
          address={drawerState.address}
          daoId={daoId.toUpperCase() as DaoIdEnum}
        />
      )}

      {/* Filter Drawer */}
      <ActivityFeedFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />

      {/* Feed content */}
      <div className={cn("flex flex-col gap-2", className)}>
        {error && (
          <SubSectionsContainer>
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <p className="text-error text-sm">Failed to load activity feed</p>
              <button
                onClick={() => refetch()}
                className="text-link hover:text-link-hover text-sm underline"
              >
                Try again
              </button>
            </div>
          </SubSectionsContainer>
        )}

        {loading && events.length === 0 && (
          <SubSectionsContainer>
            <div className="flex flex-col">
              {Array.from({ length: 10 }).map((_, i) => (
                <FeedEventSkeleton key={i} />
              ))}
            </div>
          </SubSectionsContainer>
        )}

        {!loading && events.length === 0 && !error && (
          <SubSectionsContainer>
            <BlankSlate
              variant="default"
              icon={Activity}
              description="No activity found"
            >
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-link hover:text-link-hover text-sm underline"
                >
                  Clear filters
                </button>
              )}
            </BlankSlate>
          </SubSectionsContainer>
        )}

        {groupedEvents.map((group) => (
          <SubSectionsContainer
            className="py-0 sm:py-0 lg:py-0"
            key={group.date}
          >
            {/* Sticky date header */}
            <div className="bg-surface-contrast sticky top-0 z-10 px-5 py-3 sm:-mx-5">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono text-xs font-medium uppercase">
                  {group.label}
                </span>
                <BulletDivider />
                <span className="text-secondary font-mono text-xs">
                  {group.highRelevanceCount} HIGH RELEVANCE{" "}
                  {group.highRelevanceCount === 1 ? "ACTIVITY" : "ACTIVITIES"}
                </span>
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-col">
              {group.events.map((event, index) => (
                <FeedEventItem
                  key={`${event.txHash}-${event.logIndex}`}
                  event={event}
                  isLast={index === group.events.length - 1}
                  onRowClick={(address, entityType) =>
                    setDrawerState({ address, entityType })
                  }
                />
              ))}
            </div>
          </SubSectionsContainer>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="h-1" />

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="text-secondary size-6 animate-spin" />
          </div>
        )}
      </div>
    </TheSectionLayout>
  );
};
