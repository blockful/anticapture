import type { FeedItem } from "@anticapture/client";

export interface FeedEventGroup {
  label: string;
  date: string;
  events: FeedItem[];
  highRelevanceCount: number;
}

// YYYY-MM-DD in local timezone, used as both the map key and the day boundary.
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const groupFeedEventsByDate = (
  events: FeedItem[],
  sortOrder: "asc" | "desc" = "desc",
): FeedEventGroup[] => {
  const groups: FeedEventGroup[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const currentYear = today.getFullYear();

  const todayKey = getLocalDateKey(today);
  const yesterdayKey = getLocalDateKey(yesterday);

  const eventsByDate = new Map<string, FeedItem[]>();

  events.forEach((event) => {
    const eventDate = new Date(Number(event.timestamp) * 1000);
    const dateKey = getLocalDateKey(eventDate);

    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) =>
    sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a),
  );

  sortedDates.forEach((dateKey) => {
    const dateEvents = eventsByDate.get(dateKey)!;
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
      (e) => e.relevance === "HIGH",
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
