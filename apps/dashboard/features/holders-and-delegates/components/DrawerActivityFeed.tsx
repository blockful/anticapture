"use client";

import { getNextPageParam } from "@anticapture/client";
import type {
  FeedEventsPathParams,
  FeedEventsQueryParamsRelevanceEnumKey,
} from "@anticapture/client";
import { useFeedEventsInfinite } from "@anticapture/client/hooks";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";

import { FeedEventItem } from "@/features/feed/components/FeedEventItem";
import type { EntityType } from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";

const RELEVANCE_OPTIONS: {
  value: FeedEventsQueryParamsRelevanceEnumKey | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

interface DrawerActivityFeedProps {
  address: string;
  daoId: DaoIdEnum;
}

// Recent activity feed scoped to a single address, shown inside the profile
// drawer (DEV-562 item 3). Reuses the feed's event renderer and the new
// `address` filter on GET /:dao/feed/events.
export const DrawerActivityFeed = ({
  address,
  daoId,
}: DrawerActivityFeedProps) => {
  const [orderDirection, setOrderDirection] = useQueryState(
    "feedOrder",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const [relevance, setRelevance] = useQueryState(
    "feedRelevance",
    parseAsString.withDefault("ALL"),
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeedEventsInfinite(
      daoId.toLowerCase() as FeedEventsPathParams["dao"],
      {
        address,
        limit: 20,
        orderDirection,
        ...(relevance !== "ALL"
          ? { relevance: relevance as FeedEventsQueryParamsRelevanceEnumKey }
          : {}),
      },
      { query: { getNextPageParam } },
    );

  const events = data?.pages ? data.pages.flatMap((page) => page.items) : [];

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [setDrawerAddress, setDrawerTab] = [
    useQueryState("drawerAddress")[1],
    useQueryState("drawerTab")[1],
  ];

  const handleRowClick = (clicked: string, _entityType: EntityType) => {
    setDrawerTab(null);
    setDrawerAddress(clicked);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs font-medium">Date</span>
          <div className="bg-surface-contrast flex rounded-lg p-0.5">
            {(["desc", "asc"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setOrderDirection(dir)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  orderDirection === dir
                    ? "bg-middle-dark text-primary"
                    : "text-secondary",
                )}
              >
                {dir === "desc" ? "Newest first" : "Oldest first"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs font-medium">Relevance</span>
          <div className="bg-surface-contrast flex rounded-lg p-0.5">
            {RELEVANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRelevance(opt.value)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  relevance === opt.value
                    ? "bg-middle-dark text-primary"
                    : "text-secondary",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-4 pl-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="No governance activity was found for this address in the selected filters."
          />
        ) : (
          <>
            {events.map((event, index) => (
              <FeedEventItem
                key={`${event.txHash}-${event.logIndex}`}
                event={event}
                isLast={index === events.length - 1}
                onRowClick={handleRowClick}
              />
            ))}
            <div ref={sentinelRef} />
            {isFetchingNextPage && (
              <div className="text-link flex h-12 items-center justify-center font-mono text-xs tracking-wider">
                LOADING...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
