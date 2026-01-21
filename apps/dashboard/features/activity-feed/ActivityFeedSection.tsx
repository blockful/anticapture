"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { useActivityFeed } from "@/features/activity-feed/hooks/useActivityFeed";
import { FeedEventItem } from "@/features/activity-feed/components/FeedEventItem";
import { FeedEventSkeleton } from "@/features/activity-feed/components/FeedEventSkeleton";
import { ActivityFeedFilters } from "@/features/activity-feed/components/ActivityFeedFilters";
import {
  FeedEventType,
  FeedEventRelevance,
} from "@/features/activity-feed/types";

interface ActivityFeedSectionProps {
  className?: string;
}

export const ActivityFeedSection = ({
  className,
}: ActivityFeedSectionProps) => {
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();
  const [selectedTypes, setSelectedTypes] = useState<FeedEventType[]>([]);
  const [selectedRelevances, setSelectedRelevances] = useState<
    FeedEventRelevance[]
  >([]);

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
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      relevances:
        selectedRelevances.length > 0 ? selectedRelevances : undefined,
    },
  });

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-brand size-5" />
          <h2 className="text-primary text-xl font-semibold">Activity Feed</h2>
          {!loading && (
            <span className="text-secondary text-sm">
              ({totalCount} events)
            </span>
          )}
        </div>

        <button
          onClick={refetch}
          disabled={loading}
          className="bg-surface-contrast hover:bg-surface-hover text-secondary hover:text-primary flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <ActivityFeedFilters
        selectedTypes={selectedTypes}
        selectedRelevances={selectedRelevances}
        onTypesChange={setSelectedTypes}
        onRelevancesChange={setSelectedRelevances}
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
            {(selectedTypes.length > 0 || selectedRelevances.length > 0) && (
              <button
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedRelevances([]);
                }}
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
