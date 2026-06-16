import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { type AuthfulDrizzle, tokens } from "@/database";

export type DBToken = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;

export class TokensRepository {
  constructor(private readonly db: AuthfulDrizzle) {}

  async list(): Promise<DBToken[]> {
    return this.db.select().from(tokens).orderBy(desc(tokens.createdAt));
  }

  async create(token: NewToken): Promise<DBToken> {
    const [created] = await this.db.insert(tokens).values(token).returning();
    return created!;
  }

  async findActiveByHash(tokenHash: string): Promise<DBToken | undefined> {
    return this.db.query.tokens.findFirst({
      where: and(eq(tokens.tokenHash, tokenHash), isNull(tokens.revokedAt)),
    });
  }

  /** Sets revoked_at; idempotent. Returns false when the id doesn't exist. */
  async revoke(id: string): Promise<boolean> {
    const result = await this.db
      .update(tokens)
      .set({ revokedAt: sql`coalesce(${tokens.revokedAt}, now())` })
      .where(eq(tokens.id, id))
      .returning();
    return result.length > 0;
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.db
      .update(tokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(tokens.id, id));
  }
}
