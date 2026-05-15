import { and, desc, eq } from "drizzle-orm";

import { type UnifiedDrizzle, proposalDrafts } from "@/database";

export type DBProposalDraft = typeof proposalDrafts.$inferSelect;
export type NewProposalDraft = typeof proposalDrafts.$inferInsert;

export class DraftProposalsRepository {
  constructor(private readonly db: UnifiedDrizzle) {}

  async findByAuthorAndDao(
    author: string,
    daoId: string,
  ): Promise<DBProposalDraft[]> {
    return this.db
      .select()
      .from(proposalDrafts)
      .where(
        and(
          eq(proposalDrafts.author, author.toLowerCase()),
          eq(proposalDrafts.daoId, daoId),
        ),
      )
      .orderBy(desc(proposalDrafts.updatedAt));
  }

  async findById(id: string): Promise<DBProposalDraft | undefined> {
    return this.db.query.proposalDrafts.findFirst({
      where: eq(proposalDrafts.id, id),
    });
  }

  async create(draft: NewProposalDraft): Promise<DBProposalDraft> {
    const [created] = await this.db
      .insert(proposalDrafts)
      .values(draft)
      .returning();
    return created!;
  }

  async update(
    id: string,
    author: string,
    data: Partial<
      Pick<
        NewProposalDraft,
        "title" | "discussionUrl" | "body" | "actions" | "updatedAt"
      >
    >,
  ): Promise<DBProposalDraft | undefined> {
    const [updated] = await this.db
      .update(proposalDrafts)
      .set(data)
      .where(
        and(
          eq(proposalDrafts.id, id),
          eq(proposalDrafts.author, author.toLowerCase()),
        ),
      )
      .returning();
    return updated;
  }

  async delete(id: string, author: string): Promise<boolean> {
    const result = await this.db
      .delete(proposalDrafts)
      .where(
        and(
          eq(proposalDrafts.id, id),
          eq(proposalDrafts.author, author.toLowerCase()),
        ),
      )
      .returning();
    return result.length > 0;
  }
}
