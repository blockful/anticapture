import {
  and,
  between,
  desc,
  eq,
  inArray,
  isNull,
  like,
  lt,
  sql,
} from "drizzle-orm";

import {
  type AuthfulDrizzle,
  tokenUsageBatches,
  tokenUsageDaily,
  tokens,
} from "@/database";

export type DBToken = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
export type TokenUsage = typeof tokenUsageDaily.$inferSelect;
export type TokenUsageIncrement = TokenUsage;

export class TokensRepository {
  constructor(private readonly db: AuthfulDrizzle) {}

  async list(): Promise<DBToken[]> {
    return this.db.select().from(tokens).orderBy(desc(tokens.createdAt));
  }

  async listByTenant(tenant: string): Promise<DBToken[]> {
    return this.db
      .select()
      .from(tokens)
      .where(eq(tokens.tenant, tenant))
      .orderBy(desc(tokens.createdAt));
  }

  /**
   * Active tokens only — the provisioning enrichment path (User API
   * lastUsedAt lookups) must stay bounded under key churn: revoked rows
   * accumulate forever, active rows are quota-capped.
   */
  async listActiveByTenant(tenant: string): Promise<DBToken[]> {
    return this.db
      .select()
      .from(tokens)
      .where(and(eq(tokens.tenant, tenant), isNull(tokens.revokedAt)))
      .orderBy(desc(tokens.createdAt));
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

  async findById(id: string): Promise<DBToken | undefined> {
    return this.db.query.tokens.findFirst({ where: eq(tokens.id, id) });
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

  async incrementUsage(
    idempotencyKey: string,
    items: TokenUsageIncrement[],
    options: { requireTenantPrefix?: string } = {},
  ): Promise<void> {
    const increments = new Map<string, TokenUsageIncrement>();
    for (const item of items) {
      const key = `${item.tokenId}:${item.day}`;
      const previous = increments.get(key);
      increments.set(key, {
        ...item,
        count: (previous?.count ?? 0) + item.count,
      });
    }

    await this.db.transaction(async (tx) => {
      const claimed = await tx
        .insert(tokenUsageBatches)
        .values({ idempotencyKey })
        .onConflictDoNothing()
        .returning();
      if (claimed.length === 0) return;

      const tokenIds = [...new Set(items.map(({ tokenId }) => tokenId))];
      if (tokenIds.length > 0) {
        const tenantFilter = options.requireTenantPrefix
          ? like(tokens.tenant, `${options.requireTenantPrefix}%`)
          : undefined;
        const existingTokens = await tx
          .select({ id: tokens.id })
          .from(tokens)
          .where(and(inArray(tokens.id, tokenIds), tenantFilter));
        const existingIds = new Set(existingTokens.map(({ id }) => id));
        const today = daysAgo(0);
        const oldestRetainedDay = usagePruneBefore();
        const knownIncrements = [...increments.values()].filter(
          ({ tokenId, day }) =>
            existingIds.has(tokenId) &&
            day >= oldestRetainedDay &&
            day <= today,
        );

        if (knownIncrements.length > 0) {
          await tx
            .insert(tokenUsageDaily)
            .values(knownIncrements)
            .onConflictDoUpdate({
              target: [tokenUsageDaily.tokenId, tokenUsageDaily.day],
              set: {
                count: sql`${tokenUsageDaily.count} + excluded.count`,
              },
            });
        }
      }

      // ponytail: prune-on-write, move to a cron if writes get hot
      await tx
        .delete(tokenUsageDaily)
        .where(lt(tokenUsageDaily.day, usagePruneBefore()));
      await tx
        .delete(tokenUsageBatches)
        .where(
          lt(tokenUsageBatches.createdAt, sql`now() - interval '31 days'`),
        );
    });
  }

  async listUsageByTenant(tenant: string): Promise<TokenUsage[]> {
    const { start, end } = usageReadWindow();
    return this.db
      .select({
        tokenId: tokenUsageDaily.tokenId,
        day: tokenUsageDaily.day,
        count: tokenUsageDaily.count,
      })
      .from(tokenUsageDaily)
      .innerJoin(tokens, eq(tokenUsageDaily.tokenId, tokens.id))
      .where(
        and(
          eq(tokens.tenant, tenant),
          between(tokenUsageDaily.day, start, end),
        ),
      )
      .orderBy(tokenUsageDaily.day, tokenUsageDaily.tokenId);
  }
}

const utcDay = (date: Date): string => date.toISOString().slice(0, 10);

const daysAgo = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return utcDay(date);
};

const usageReadWindow = (): { start: string; end: string } => ({
  start: daysAgo(29),
  end: daysAgo(0),
});

const usagePruneBefore = (): string => daysAgo(30);
