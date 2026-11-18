import { sql } from "drizzle-orm";

import {
  Drizzle,
  daoMetricsDayBucket,
  feedEvent,
  proposalsOnchain,
  transfer,
  votesOnchain,
} from "@/database";

export interface HealthRepository {
  pingDatabase(): Promise<void>;
  getLastEventTimestamp(): Promise<number | null>;
}

export class HealthRepositoryImpl implements HealthRepository {
  constructor(private readonly db: Drizzle) {}

  async pingDatabase(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  /**
   * Latest indexed activity across the tables the handlers write to. The
   * feed alone misses queued/executed proposals and metric updates, which
   * made a quiet DAO look stalled.
   */
  async getLastEventTimestamp(): Promise<number | null> {
    const row = await this.db
      .select({
        timestamp: sql<string | null>`greatest(
          (select max(${feedEvent.timestamp}) from ${feedEvent}),
          (select max(${votesOnchain.timestamp}) from ${votesOnchain}),
          (select max(${proposalsOnchain.timestamp}) from ${proposalsOnchain}),
          (select max(${proposalsOnchain.queuedTimestamp}) from ${proposalsOnchain}),
          (select max(${proposalsOnchain.executedTimestamp}) from ${proposalsOnchain}),
          (select max(${transfer.timestamp}) from ${transfer}),
          (select max(${daoMetricsDayBucket.lastUpdate}) from ${daoMetricsDayBucket})
        )`,
      })
      .from(feedEvent)
      .limit(1);
    const raw = row[0]?.timestamp;
    return raw == null ? null : Number(raw);
  }
}
