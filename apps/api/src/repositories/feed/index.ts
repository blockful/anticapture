import { and, asc, desc, eq, gte, lte, or, SQL } from "drizzle-orm";

import { DBFeedEvent, FeedRequest } from "@/mappers";
import { feedEvent, ReadonlyDrizzle } from "@/database";
import { FeedEventType } from "@/lib/constants";

export class FeedRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getFeedEvents(
    req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
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

    const items = await this.db.query.feedEvent.findMany({
      where,
      orderBy: orderByFn,
      offset: skip,
      limit,
    });

    const totalCount = await this.db.$count(feedEvent, where);

    return {
      items,
      totalCount,
    };
  }

  private buildRelevanceFilter(
    type: FeedEventType | undefined,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ): SQL | undefined {
    const conditions: SQL[] = [];

    if (type) {
      if (
        type === FeedEventType.PROPOSAL ||
        type === FeedEventType.PROPOSAL_EXTENDED
      ) {
        conditions.push(eq(feedEvent.type, type));
      } else {
        const threshold = valueThresholds[type];
        if (threshold) {
          conditions.push(
            and(eq(feedEvent.type, type), gte(feedEvent.value, threshold))!,
          );
        }
      }
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
      // Always include PROPOSAL (no value threshold)
      if (!(FeedEventType.PROPOSAL in valueThresholds)) {
        conditions.push(eq(feedEvent.type, FeedEventType.PROPOSAL));
      }
      if (!(FeedEventType.PROPOSAL_EXTENDED in valueThresholds)) {
        conditions.push(eq(feedEvent.type, FeedEventType.PROPOSAL_EXTENDED));
      }
    }

    return conditions.length > 0 ? or(...conditions) : undefined;
  }
}
