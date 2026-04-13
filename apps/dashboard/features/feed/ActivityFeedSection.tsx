"use client";

import { Activity, Filter, Loader2, Newspaper } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

import { ActivityFeedFiltersDrawer } from "@/features/feed/components/ActivityFeedFilters";
import { FeedEventItem } from "@/features/feed/components/FeedEventItem";
import { FeedEventSkeleton } from "@/features/feed/components/FeedEventSkeleton";
import { useActivityFeed } from "@/features/feed/hooks/useActivityFeed";
import { useActivityFeedParams } from "@/features/feed/hooks/useActivityFeedParams";
import type { EntityType } from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import { Button, BlankSlate, TheSectionLayout } from "@/shared/components";
import {
  SubSectionsContainer,
  BulletDivider,
} from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";

export const ActivityFeedSection = () => {
  const { daoId } = useParams<{ daoId: string }>();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [drawerState, setDrawerState] = useState<{
    address: string;
    entityType: EntityType;
  } | null>(null);
  const { filters, setFilters, clearFilters, activeFiltersCount } =
    useActivityFeedParams();

  const {
    data: events,
    loading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useActivityFeed({
    filters: {
      limit: 20,
      orderBy: filters.orderBy,
      orderDirection: filters.orderDirection,
      relevance: filters.relevance,
      type: filters.type,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    },
  });

  // Infinite scroll with Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !loading) {
        fetchNextPage();
      }
    },
    [hasNextPage, loading, fetchNextPage],
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
        onClearFilters={clearFilters}
      />

      {/* Feed content */}
      <div className={cn("flex flex-col gap-2")}>
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

        {events.map((group) => (
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

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="text-secondary size-6 animate-spin" />
          </div>
        )}
      </div>
    </TheSectionLayout>
  );
};
