"use client";

import { getNextPageParam } from "@anticapture/client";
import type {
  FeedEventsPathParams,
  FeedEventsQueryParamsRelevanceEnumKey,
} from "@anticapture/client";
import { useFeedEventsInfinite } from "@anticapture/client/hooks";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";

import { useDrawerEntityOverride } from "@/features/holders-and-delegates/hooks/useDrawerEntityOverride";
import { useDrawerNavigation } from "@/features/holders-and-delegates/hooks/useDrawerNavigation";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control";
import { FeedEventItem } from "@/shared/components/feed/FeedEventItem";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { EntityType } from "@/shared/types/entities";
import { groupFeedEventsByDate } from "@/shared/utils/groupFeedEventsByDate";

type RelevanceOption = FeedEventsQueryParamsRelevanceEnumKey | "ALL";

const RELEVANCE_OPTIONS: {
  value: RelevanceOption;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const RELEVANCE_VALUES = RELEVANCE_OPTIONS.map((option) => option.value);

interface DrawerActivityFeedProps {
  address: string;
  daoId: DaoIdEnum;
}

export const DrawerActivityFeed = ({
  address,
  daoId,
}: DrawerActivityFeedProps) => {
  const [orderDirection, setOrderDirection] = useQueryState(
    "feedOrder",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  // Enum parsed, not a plain string: the API rejects any other value with a 400,
  // so a stale `?feedRelevance=foo` would leave this tab stuck on an error state
  // until the query string was cleared by hand.
  const [relevance, setRelevance] = useQueryState(
    "feedRelevance",
    parseAsStringEnum<RelevanceOption>(RELEVANCE_VALUES).withDefault("ALL"),
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeedEventsInfinite(
    daoId.toLowerCase() as FeedEventsPathParams["dao"],
    {
      address,
      limit: 20,
      orderDirection,
      // Always sent explicitly: the API reads a missing `relevance` as MEDIUM,
      // whose thresholds would hide most of the address's activity.
      relevance: relevance as FeedEventsQueryParamsRelevanceEnumKey,
    },
    // An empty address would be rejected with a 400 while the drawer closes.
    { query: { getNextPageParam, enabled: Boolean(address) } },
  );

  const events = data?.pages ? data.pages.flatMap((page) => page.items) : [];
  const groupedEvents = groupFeedEventsByDate(events, orderDirection);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      // The scroll container has to be the root: against the viewport the
      // sentinel sits on its clipped edge and never registers as visible,
      // leaving the feed stuck on its first page.
      { root: scrollRef.current, rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [setDrawerAddress, setDrawerTab] = [
    useQueryState("drawerAddress")[1],
    useQueryState("drawerTab")[1],
  ];
  const { setDrawerEntity } = useDrawerEntityOverride();
  // `drawerAddress` re-points the owners that read it from the URL; the drawer
  // itself covers the ones holding the address in local state.
  const navigation = useDrawerNavigation();

  // Clicking a delegate from a token-holder drawer has to open the delegate
  // profile, so the clicked entity type travels with the clicked address.
  const handleRowClick = (clicked: string, clickedEntityType: EntityType) => {
    setDrawerTab(null);
    setDrawerEntity(clickedEntityType, clicked);
    setDrawerAddress(clicked);
    navigation?.repoint(clicked);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs font-medium">Date</span>
          <SegmentedControl
            size="sm"
            value={orderDirection}
            onValueChange={(value) =>
              setOrderDirection(value as "asc" | "desc")
            }
            items={[
              { value: "desc", label: "Newest first" },
              { value: "asc", label: "Oldest first" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs font-medium">Relevance</span>
          <SegmentedControl
            size="sm"
            value={relevance}
            onValueChange={(value) => setRelevance(value as RelevanceOption)}
            items={RELEVANCE_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-4 pl-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          // A failed request must not read as "this address did nothing".
          <EmptyState
            title="Could not load activity"
            description="Something went wrong fetching this address's activity. Try again in a moment."
          />
        ) : events.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="No governance activity was found for this address in the selected filters."
          />
        ) : (
          <>
            {groupedEvents.map((group) => (
              <div key={group.date}>
                <div className="bg-surface-contrast top-0 z-10 mx-0 mb-4 px-5 py-3">
                  <span className="text-primary font-mono text-xs font-medium uppercase">
                    {group.label}
                  </span>
                </div>
                {group.events.map((event, index) => (
                  <FeedEventItem
                    key={`${event.txHash}-${event.logIndex}`}
                    event={event}
                    isLast={index === group.events.length - 1}
                    onRowClick={handleRowClick}
                  />
                ))}
              </div>
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
