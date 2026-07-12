import { and, count, desc, eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

import type { UserApiDrizzle } from "@/database/types";
import { userApiKeys } from "@/database/schema";

export type ApiKeyRow = typeof userApiKeys.$inferSelect;

export class ApiKeysRepository {
  constructor(private readonly db: UserApiDrizzle) {}

  /**
   * Quota-checked insert, serialized per user: the transaction-scoped
   * advisory lock queues concurrent creates for the same user, so the
   * active-key count can't be read stale and the cap can't be raced past.
   * Returns undefined when the quota is already full.
   */
  async createWithinQuota(
    input: {
      userId: string;
      authfulTokenId: string;
      label: string;
    },
    maxPerUser: number,
  ): Promise<ApiKeyRow | undefined> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${input.userId}))`,
      );

      const [current] = await tx
        .select({ value: count() })
        .from(userApiKeys)
        .where(
          and(
            eq(userApiKeys.userId, input.userId),
            isNull(userApiKeys.revokedAt),
          ),
        );
      if ((current?.value ?? 0) >= maxPerUser) return undefined;

      const [row] = await tx.insert(userApiKeys).values(input).returning();
      return row as ApiKeyRow;
    });
  }

  /** Active (non-revoked) keys for a user, newest first. */
  async listActiveByUser(userId: string): Promise<ApiKeyRow[]> {
    return this.db
      .select()
      .from(userApiKeys)
      .where(and(eq(userApiKeys.userId, userId), isNull(userApiKeys.revokedAt)))
      .orderBy(desc(userApiKeys.createdAt));
  }

  async countActiveByUser(userId: string): Promise<number> {
    const rows = await this.listActiveByUser(userId);
    return rows.length;
  }

  /** Ownership is in the WHERE clause: a foreign id matches zero rows. */
  async findOwned(id: string, userId: string): Promise<ApiKeyRow | undefined> {
    const [row] = await this.db
      .select()
      .from(userApiKeys)
      .where(and(eq(userApiKeys.id, id), eq(userApiKeys.userId, userId)))
      .limit(1);
    return row;
  }

  async markRevoked(id: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .update(userApiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(userApiKeys.id, id),
          eq(userApiKeys.userId, userId),
          isNull(userApiKeys.revokedAt),
        ),
      )
      .returning();
    return rows.length > 0;
  }
}
