import { and, desc, eq, isNull } from "drizzle-orm";

import type { UserApiDrizzle } from "@/database/types";
import { userApiKeys } from "@/database/schema";

export type ApiKeyRow = typeof userApiKeys.$inferSelect;

export class ApiKeysRepository {
  constructor(private readonly db: UserApiDrizzle) {}

  async create(input: {
    userId: string;
    authfulTokenId: string;
    label: string;
  }): Promise<ApiKeyRow> {
    const [row] = await this.db.insert(userApiKeys).values(input).returning();
    return row as ApiKeyRow;
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
