import { and, asc, desc, eq, gte, lte, or, SQL } from "drizzle-orm";

import { feedEvent, ReadonlyDrizzle } from "@/database";
import { FeedEventType } from "@/lib/constants";
import { DBFeedEvent, FeedRequest } from "@/mappers";

export class FeedRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getFeedEvents(
    req: FeedRequest,
    valueThresholds: Record<FeedEventType, bigint>,
  ): Promise<{
    items: DBFeedEvent[];
    totalCount: number;
  }> {
    const { skip, limit, orderBy, orderDirection, type, fromDate, toDate } =
      req;

    const relevanceFilter = this.buildRelevanceFilter(type, valueThresholds);

    const where = and(
      fromDate ? gte(feedEvent.timestamp, fromDate) : undefined,
      toDate ? lte(feedEvent.timestamp, toDate) : undefined,
      relevanceFilter,
    );

    const orderByColumn =
      orderBy === "timestamp" ? feedEvent.timestamp : feedEvent.value;
    const orderByFn =
      orderDirection === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [items, totalCount] = await Promise.all([
      this.db.query.feedEvent.findMany({
        where,
        orderBy: orderByFn,
        offset: skip,
        limit,
      }),
      this.db.$count(feedEvent, where),
    ]);

    return {
      items,
      totalCount,
    };
  }

  private buildRelevanceFilter(
    type: FeedEventType | undefined,
    valueThresholds: Record<FeedEventType, bigint>,
  ): SQL | undefined {
    const conditions: SQL[] = [];

    if (type) {
      const threshold = valueThresholds[type];
      conditions.push(
        and(eq(feedEvent.type, type), gte(feedEvent.value, threshold))!,
      );
    } else {
      // No type filter - build per-type conditions with OR
      for (const [eventType, minValue] of Object.entries(valueThresholds)) {
        conditions.push(
          and(
            eq(feedEvent.type, eventType as FeedEventType),
            gte(feedEvent.value, minValue),
          )!,
        );
      }
    }

    return conditions.length > 0 ? or(...conditions) : undefined;
  }
}
