import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { Repository } from "@/repository/db.interface";
import type { OffchainProposal, OffchainVote } from "@/repository/schema";
import * as schema from "@/repository/schema";

export class DrizzleRepository implements Repository {
  private constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  static async create(db: NodePgDatabase<typeof schema>): Promise<DrizzleRepository> {
    await migrate(db, {
      migrationsFolder: "./drizzle",
      migrationsSchema: "snapshot",
    });
    return new DrizzleRepository(db);
  }

  async resetCursor(entity: string): Promise<void> {
    await this.db
      .delete(schema.syncStatus)
      .where(eq(schema.syncStatus.entity, entity));
  }

  async getLastCursor(entity: string): Promise<string | null> {
    const [row] = await this.db
      .select({ lastCursor: schema.syncStatus.lastCursor })
      .from(schema.syncStatus)
      .where(eq(schema.syncStatus.entity, entity));

    return row?.lastCursor ?? null;
  }

  async saveProposals(proposals: OffchainProposal[], cursor: string): Promise<void> {
    if (proposals.length === 0) return;

    await this.db.transaction(async (tx) => {
      await tx
        .insert(schema.proposals)
        .values(proposals)
        .onConflictDoUpdate({
          target: schema.proposals.id,
          set: {
            author: sql`excluded.author`,
            title: sql`excluded.title`,
            body: sql`excluded.body`,
            discussion: sql`excluded.discussion`,
            type: sql`excluded.type`,
            start: sql`excluded.start`,
            end: sql`excluded."end"`,
            state: sql`excluded.state`,
            created: sql`excluded.created`,
            updated: sql`excluded.updated`,
            link: sql`excluded.link`,
            flagged: sql`excluded.flagged`,
          },
        });

      await tx
        .insert(schema.syncStatus)
        .values({
          entity: "proposals",
          lastCursor: cursor,
          lastSyncedAt: Math.floor(Date.now() / 1000),
        })
        .onConflictDoUpdate({
          target: schema.syncStatus.entity,
          set: {
            lastCursor: cursor,
            lastSyncedAt: Math.floor(Date.now() / 1000),
          },
        });
    });
  }

  async saveVotes(votes: OffchainVote[], cursor: string): Promise<void> {
    if (votes.length === 0) return;

    await this.db.transaction(async (tx) => {
      await tx
        .insert(schema.votes)
        .values(votes)
        .onConflictDoUpdate({
          target: schema.votes.id,
          set: {
            voter: sql`excluded.voter`,
            proposalId: sql`excluded.proposal_id`,
            choice: sql`excluded.choice`,
            vp: sql`excluded.vp`,
            reason: sql`excluded.reason`,
            created: sql`excluded.created`,
          },
        });

      await tx
        .insert(schema.syncStatus)
        .values({
          entity: "votes",
          lastCursor: cursor,
          lastSyncedAt: Math.floor(Date.now() / 1000),
        })
        .onConflictDoUpdate({
          target: schema.syncStatus.entity,
          set: {
            lastCursor: cursor,
            lastSyncedAt: Math.floor(Date.now() / 1000),
          },
        });
    });
  }
}
