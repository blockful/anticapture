import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import type { UserApiDrizzle } from "@/database/types";
import { drafts, walletAddress } from "@/database/schema";

export type DraftRow = typeof drafts.$inferSelect;

export type CreateDraftInput = {
  userId: string;
  authorAddress: string | null;
  daoId: string;
  title: string;
  discussionUrl: string;
  body: string;
  actions: unknown[];
};

export type UpdateDraftInput = Partial<
  Pick<CreateDraftInput, "title" | "discussionUrl" | "body" | "actions">
>;

export class DraftsRepository {
  constructor(private readonly db: UserApiDrizzle) {}

  async listByUserAndDao(userId: string, daoId: string): Promise<DraftRow[]> {
    return this.db
      .select()
      .from(drafts)
      .where(and(eq(drafts.userId, userId), eq(drafts.daoId, daoId)))
      .orderBy(desc(drafts.updatedAt));
  }

  async findById(id: string): Promise<DraftRow | undefined> {
    const [row] = await this.db
      .select()
      .from(drafts)
      .where(eq(drafts.id, id))
      .limit(1);
    return row;
  }

  async create(input: CreateDraftInput): Promise<DraftRow> {
    const now = Date.now();
    const [row] = await this.db
      .insert(drafts)
      .values({
        userId: input.userId,
        authorAddress: input.authorAddress?.toLowerCase() ?? null,
        daoId: input.daoId,
        title: input.title,
        discussionUrl: input.discussionUrl,
        body: input.body,
        actions: input.actions,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row as DraftRow;
  }

  /** Ownership lives in the WHERE clause: a foreign row matches zero rows. */
  async update(
    id: string,
    userId: string,
    patch: UpdateDraftInput,
  ): Promise<DraftRow | undefined> {
    const [row] = await this.db
      .update(drafts)
      .set({ ...patch, updatedAt: Date.now() })
      .where(and(eq(drafts.id, id), eq(drafts.userId, userId)))
      .returning();
    return row;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .delete(drafts)
      .where(and(eq(drafts.id, id), eq(drafts.userId, userId)))
      .returning();
    return rows.length > 0;
  }

  async countByUser(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(drafts)
      .where(eq(drafts.userId, userId));
    return row?.value ?? 0;
  }

  /** Wallets linked to the user by the SIWE plugin, lowercased. */
  async findWalletAddresses(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ address: walletAddress.address })
      .from(walletAddress)
      .where(eq(walletAddress.userId, userId));
    return rows.map((r) => r.address.toLowerCase());
  }

  /**
   * Attaches migrated, still-unclaimed rows (userId IS NULL) whose
   * authorAddress matches one of the user's wallets. Idempotent.
   */
  async claimByAddresses(userId: string, addresses: string[]): Promise<void> {
    if (addresses.length === 0) return;
    await this.db
      .update(drafts)
      .set({ userId })
      .where(
        and(
          isNull(drafts.userId),
          inArray(sql`lower(${drafts.authorAddress})`, addresses),
        ),
      );
  }
}
