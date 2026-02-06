import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { DBFeedEvent, FeedRequest } from "@/mappers";
import { feedEvent, ReadonlyDrizzle } from "@/database";

export class FeedRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getFeedEvents({
    skip,
    limit,
    orderDirection,
    orderBy,
    fromDate,
    toDate,
    relevance,
    type,
  }: FeedRequest): Promise<{ items: DBFeedEvent[]; totalCount: number }> {
    const where = and(
      fromDate ? gte(feedEvent.timestamp, fromDate) : undefined,
      toDate ? lte(feedEvent.timestamp, toDate) : undefined,
      type ? eq(feedEvent.type, type) : undefined,
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
}
