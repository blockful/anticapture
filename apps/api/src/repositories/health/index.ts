import { sql } from "drizzle-orm";

import { Drizzle, feedEvent } from "@/database";

export interface HealthRepository {
  pingDatabase(): Promise<void>;
  getLastEventTimestamp(): Promise<number | null>;
}

export class HealthRepositoryImpl implements HealthRepository {
  constructor(private readonly db: Drizzle) {}

  async pingDatabase(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async getLastEventTimestamp(): Promise<number | null> {
    const row = await this.db
      .select({ timestamp: sql<number>`max(${feedEvent.timestamp})` })
      .from(feedEvent);
    const raw = row[0]?.timestamp;
    return raw == null ? null : Number(raw);
  }
}
